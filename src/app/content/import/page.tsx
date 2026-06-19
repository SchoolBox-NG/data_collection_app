import { AccessShell } from "@/components/AccessShell";
import { requireRole } from "@/lib/auth/guards";
import { ContentImportClient } from "./ContentImportClient";

export const dynamic = "force-dynamic";

export default async function ContentImportPage() {
  const user = await requireRole(["content_admin"]);

  return (
    <AccessShell user={user} eyebrow="Content Admin" title="Content import">
      <ContentImportClient />
    </AccessShell>
  );
}
