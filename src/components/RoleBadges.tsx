import { type Role, ROLE_LABELS } from "@/lib/auth/roles";

export function RoleBadges({ roles }: { roles: readonly Role[] }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role}
          className="max-w-full rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900"
        >
          {ROLE_LABELS[role]}
        </span>
      ))}
    </div>
  );
}
