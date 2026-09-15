import { createClient } from "@/lib/supabase/server";
import { CompareCandidates } from "@/components/admin/CompareCandidates";

export default async function ComparePage() {
  const supabase = await createClient();
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, full_name")
    .order("full_name");

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-indigo-950">Comparar candidatos</h1>
      <CompareCandidates candidates={candidates ?? []} />
    </main>
  );
}
