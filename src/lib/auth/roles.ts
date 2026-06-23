export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase() ?? "chimanwakis@gmail.com";

export const USER_ROLES = [
  "content_admin",
  "igbo_teacher",
  "reviewer",
  "dataset_admin",
] as const;

export const ALL_ROLES = ["admin", ...USER_ROLES] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type Role = (typeof ALL_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  content_admin: "Content Admin",
  igbo_teacher: "Igbo Teacher",
  reviewer: "Reviewer",
  dataset_admin: "Dataset Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Full system access, including user and role management.",
  content_admin: "Upload, edit, and prepare English source content.",
  igbo_teacher: "Translate assigned content and submit Igbo audio.",
  reviewer: "Review translation and audio quality separately.",
  dataset_admin: "Export approved translation and TTS datasets.",
};

export const DEFAULT_USER_ROLES: UserRole[] = ["igbo_teacher"];

export const ROLE_DASHBOARD_LINKS = [
  {
    href: "/content",
    title: "Content records",
    description: "Search imported records by review and work status.",
    roles: ["content_admin"],
  },
  {
    href: "/content/import",
    title: "Content import",
    description: "Upload and prepare English curriculum content.",
    roles: ["content_admin"],
  },
  {
    href: "/teacher/tasks",
    title: "Teacher tasks",
    description: "Translate assigned records and prepare audio.",
    roles: ["igbo_teacher"],
  },
  {
    href: "/review",
    title: "Review queue",
    description: "Approve or reject translations and audio separately.",
    roles: ["reviewer"],
  },
  {
    href: "/datasets/export",
    title: "Dataset export",
    description: "Export clean translation and TTS datasets.",
    roles: ["dataset_admin"],
  },
  {
    href: "/admin/users",
    title: "Users and roles",
    description: "Manage who can access each workflow area.",
    roles: ["admin"],
  },
] satisfies Array<{
  href: string;
  title: string;
  description: string;
  roles: Role[];
}>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string) {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export function isRole(value: string): value is Role {
  return (ALL_ROLES as readonly string[]).includes(value);
}

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function normalizeRoles(email: string, roles: readonly string[] = []): Role[] {
  if (isAdminEmail(email)) {
    return ["admin", ...USER_ROLES];
  }

  const safeRoles = roles.filter(isUserRole);

  if (safeRoles.length === 0) {
    return [...DEFAULT_USER_ROLES];
  }

  return Array.from(new Set(safeRoles));
}

export function hasRole(userRoles: readonly Role[], allowedRoles: readonly Role[]) {
  if (userRoles.includes("admin")) {
    return true;
  }

  return allowedRoles.some((role) => userRoles.includes(role));
}

export function requiredRolesForPath(pathname: string): Role[] | null {
  if (pathname.startsWith("/admin")) {
    return ["admin"];
  }

  if (pathname.startsWith("/api/admin")) {
    return ["admin"];
  }

  if (pathname.startsWith("/content")) {
    return ["content_admin"];
  }

  if (pathname.startsWith("/api/content")) {
    return ["content_admin"];
  }

  if (pathname.startsWith("/api/teacher")) {
    return ["igbo_teacher"];
  }

  if (pathname.startsWith("/teacher")) {
    return ["igbo_teacher"];
  }

  if (pathname.startsWith("/review")) {
    return ["reviewer"];
  }

  if (pathname.startsWith("/api/review")) {
    return ["reviewer"];
  }

  if (pathname.startsWith("/datasets")) {
    return ["dataset_admin"];
  }

  if (pathname.startsWith("/api/datasets")) {
    return ["dataset_admin"];
  }

  return null;
}
