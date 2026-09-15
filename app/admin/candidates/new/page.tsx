import { CandidateForm } from "@/components/admin/CandidateForm";

export default function NewCandidatePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-indigo-950">Nuevo candidato</h1>
      <CandidateForm />
    </main>
  );
}
