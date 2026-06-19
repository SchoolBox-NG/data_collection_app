"use client";

import { useState } from "react";

import {
  type Role,
  ROLE_LABELS,
  USER_ROLES,
  type UserRole,
} from "@/lib/auth/roles";

export function UserRolesForm({
  userId,
  email,
  roles,
  locked,
}: {
  userId: string;
  email: string;
  roles: readonly Role[];
  locked: boolean;
}) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    roles.filter((role): role is UserRole =>
      (USER_ROLES as readonly string[]).includes(role),
    ),
  );
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleRole(role: UserRole) {
    setSelectedRoles((currentRoles) =>
      currentRoles.includes(role)
        ? currentRoles.filter((currentRole) => currentRole !== role)
        : [...currentRoles, role],
    );
  }

  async function saveRoles() {
    setSaving(true);
    setStatus("");

    const response = await fetch(`/api/admin/users/${userId}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: selectedRoles }),
    });
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    setSaving(false);
    setStatus(response.ok ? "Saved" : data?.error ?? "Could not save roles.");
  }

  if (locked) {
    return (
      <p className="text-sm leading-6 text-slate-600">
        {email} is the protected super-admin account and always keeps full access.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {USER_ROLES.map((role) => {
          const checked = selectedRoles.includes(role);

          return (
            <label
              key={role}
              className={`inline-flex w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition sm:w-auto ${
                checked
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleRole(role)}
                className="h-4 w-4 accent-emerald-700"
              />
              {ROLE_LABELS[role]}
            </label>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={saveRoles}
          disabled={saving || selectedRoles.length === 0}
          className="h-10 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {saving ? "Saving..." : "Save roles"}
        </button>
        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </div>
    </div>
  );
}
