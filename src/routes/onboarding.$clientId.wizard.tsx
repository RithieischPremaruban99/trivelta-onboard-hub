import { createFileRoute, useParams } from "@tanstack/react-router";
import { WizardLayout } from "@/components/studio/wizard/WizardLayout";

export const Route = createFileRoute("/onboarding/$clientId/wizard")({
  component: WizardPage,
});

function WizardPage() {
  const { clientId } = useParams({ strict: false }) as { clientId: string };
  return <WizardLayout clientId={clientId} />;
}
