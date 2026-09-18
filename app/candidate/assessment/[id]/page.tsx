import { CandidateAssessmentClient } from "@/components/candidate/CandidateAssessmentClient";

export default async function CandidateAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CandidateAssessmentClient assessmentId={id} />;
}
