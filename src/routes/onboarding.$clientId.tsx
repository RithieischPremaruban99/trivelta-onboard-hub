import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { OnboardingProvider } from "@/lib/onboarding-context";

export const Route = createFileRoute("/onboarding/$clientId")({
  component: OnboardingLayout,
});

function OnboardingLayout() {
  const { clientId } = useParams({ from: "/onboarding/$clientId" });
  return (
    <OnboardingProvider clientId={clientId}>
      <Outlet />
    </OnboardingProvider>
  );
}
