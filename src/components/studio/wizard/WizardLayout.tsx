import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { loadWizardState, saveWizardState } from "@/lib/wizard-state";
import { Step1CountryPicker } from "./Step1CountryPicker";
import { Step2PersonalityPicker } from "./Step2PersonalityPicker";
import { Step3BriefInput } from "./Step3BriefInput";
import { Step4ThreeOptions } from "./Step4ThreeOptions";
import type { WizardState, WizardStep } from "./wizard-types";

interface Props {
  clientId: string;
}

const STEP_LABELS: Record<number, string> = {
  1: "Where will you launch?",
  2: "Brand Personality",
  3: "Describe Your Brand",
  4: "Choose Your Options",
};

const TOTAL_STEPS = 4;

export function WizardLayout({ clientId }: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<WizardState>({ step: 1 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadWizardState(clientId);
    if (stored) setState(stored);
    setHydrated(true);
  }, [clientId]);

  useEffect(() => {
    if (!hydrated) return;
    saveWizardState(clientId, state);
  }, [clientId, state, hydrated]);

  const stepNumber = state.step === "complete" ? TOTAL_STEPS : (state.step as number);
  const progressPct = (stepNumber / TOTAL_STEPS) * 100;

  function setStep(step: WizardStep) {
    setState((s) => ({ ...s, step }));
  }

  function handleBack() {
    if (state.step === 1) {
      navigate({ to: "/dashboard" });
    } else if (typeof state.step === "number" && state.step > 1) {
      setStep((state.step - 1) as WizardStep);
    }
  }

  function handleNext() {
    if (typeof state.step === "number" && state.step < TOTAL_STEPS) {
      setStep((state.step + 1) as WizardStep);
    } else {
      setStep("complete");
      navigate({ to: `/studio-preview/${clientId}` });
    }
  }

  function renderStep() {
    switch (state.step) {
      case 1:
        return (
          <Step1CountryPicker
            selectedIso={state.targetCountry}
            isMultiMarket={state.isMultiMarket ?? false}
            onSelect={(iso, isMulti) =>
              setState((s) => ({ ...s, targetCountry: iso, isMultiMarket: isMulti }))
            }
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2PersonalityPicker
            selectedPersonality={state.targetPersonality}
            selectedPlatformType={state.targetPlatformType}
            onSelectPersonality={(personality) =>
              setState((s) => ({ ...s, targetPersonality: personality }))
            }
            onSelectPlatformType={(type) =>
              setState((s) => ({ ...s, targetPlatformType: type }))
            }
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <Step3BriefInput
            clientId={clientId}
            brandPrompt={state.brandPrompt ?? ""}
            logoUrl={state.logoUrl}
            selectedCountry={state.targetCountry}
            isMultiMarket={state.isMultiMarket ?? false}
            selectedPlatformType={state.targetPlatformType}
            selectedPersonality={state.targetPersonality}
            onChangeBrief={(text) =>
              setState((s) => ({ ...s, brandPrompt: text }))
            }
            onLogoUploaded={(url) =>
              setState((s) => ({ ...s, logoUrl: url }))
            }
            onLogoRemoved={() =>
              setState((s) => ({ ...s, logoUrl: undefined }))
            }
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 4:
        if (!state.targetPersonality) {
          return (
            <div className="text-center text-muted-foreground text-sm py-10">
              Please go back and select a brand personality.
            </div>
          );
        }
        return (
          <Step4ThreeOptions
            clientId={clientId}
            brandPrompt={state.brandPrompt ?? ""}
            logoUrl={state.logoUrl}
            selectedCountry={state.targetCountry}
            isMultiMarket={state.isMultiMarket ?? false}
            selectedPlatformType={state.targetPlatformType}
            selectedPersonality={state.targetPersonality}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      default:
        return null;
    }
  }

  const currentStepNum = typeof state.step === "number" ? state.step : TOTAL_STEPS;
  const stepLabel = STEP_LABELS[currentStepNum] ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <TriveltaLogo size="xl" brandSuffix="AI" product="Studio" />

        <div className="flex flex-col items-center gap-1.5 flex-1 mx-8">
          <span className="micro-label">
            Step {currentStepNum} of {TOTAL_STEPS}: {stepLabel}
          </span>
          <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {state.step === 1 ? (
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-2xl">{renderStep()}</div>
      </main>
    </div>
  );
}
