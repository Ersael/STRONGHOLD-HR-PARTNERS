import { AssessmentPortalClient } from "@/components/assessment/AssessmentPortalClient";

export default async function AssessmentTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AssessmentPortalClient token={token} />;
}
