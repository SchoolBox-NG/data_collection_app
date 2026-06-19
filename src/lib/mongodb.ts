import { MongoClient, type Db } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas URI to .env.");
  }

  return uri;
}

export async function getMongoClient() {
  if (!global.mongoClientPromise) {
    const client = new MongoClient(getMongoUri());
    global.mongoClientPromise = client.connect();
  }

  return global.mongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "igbo_dataset");
}
