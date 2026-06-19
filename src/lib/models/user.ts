import { ObjectId, type Collection, type WithId } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  type Role,
  normalizeEmail,
  normalizeRoles,
} from "@/lib/auth/roles";

export type UserStatus = "active" | "disabled";

export type UserDocument = {
  email: string;
  name: string;
  passwordHash: string;
  roles: Role[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

let userIndexesPromise: Promise<unknown> | undefined;

async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getMongoDb();
  const collection = db.collection<UserDocument>("users");

  userIndexesPromise ??= collection.createIndex({ email: 1 }, { unique: true });
  await userIndexesPromise;

  return collection;
}

function serializeUser(user: WithId<UserDocument>): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    roles: normalizeRoles(user.email, user.roles),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  };
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  roles?: readonly string[];
}) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim() || email;
  const now = new Date();
  const collection = await getUsersCollection();

  const result = await collection.insertOne({
    email,
    name,
    passwordHash: hashPassword(input.password),
    roles: normalizeRoles(email, input.roles),
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  const user = await collection.findOne({ _id: result.insertedId });

  if (!user) {
    throw new Error("User was created but could not be loaded.");
  }

  return serializeUser(user);
}

export async function findUserByEmail(email: string) {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ email: normalizeEmail(email) });

  return user ? serializeUser(user) : null;
}

export async function getUserById(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await getUsersCollection();
  const user = await collection.findOne({ _id: new ObjectId(id) });

  return user ? serializeUser(user) : null;
}

export async function authenticateUser(email: string, password: string) {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ email: normalizeEmail(email) });

  if (!user || user.status !== "active") {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  const normalizedRoles = normalizeRoles(user.email, user.roles);
  const now = new Date();

  await collection.updateOne(
    { _id: user._id },
    {
      $set: {
        roles: normalizedRoles,
        lastLoginAt: now,
        updatedAt: now,
      },
    },
  );

  return serializeUser({
    ...user,
    roles: normalizedRoles,
    lastLoginAt: now,
    updatedAt: now,
  });
}

export async function listUsers() {
  const collection = await getUsersCollection();
  const users = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return users.map(serializeUser);
}

export async function updateUserRoles(id: string, roles: readonly string[]) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await getUsersCollection();
  const existingUser = await collection.findOne({ _id: new ObjectId(id) });

  if (!existingUser) {
    return null;
  }

  const updatedRoles = normalizeRoles(existingUser.email, roles);
  const now = new Date();

  await collection.updateOne(
    { _id: existingUser._id },
    {
      $set: {
        roles: updatedRoles,
        updatedAt: now,
      },
    },
  );

  return serializeUser({
    ...existingUser,
    roles: updatedRoles,
    updatedAt: now,
  });
}
