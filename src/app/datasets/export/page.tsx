import { AccessShell } from "@/components/AccessShell";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DatasetExportPage() {
  const user = await requireRole(["dataset_admin"]);

  return (
    <AccessShell user={user} eyebrow="Dataset Admin" title="Dataset export">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Access granted</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          This page is protected for Dataset Admins. Translation and TTS exports
          will be implemented after content, translation, audio, and review data
          exist.
        </p>
      </section>
    </AccessShell>
  );
}
