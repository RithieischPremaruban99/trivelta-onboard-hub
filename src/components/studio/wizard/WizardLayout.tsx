import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { Button } from "@/components/ui/button";
import { loadWizardState, saveWizardState } from "@/lib/wizard-state";
import { Step1CountryPicker } from "./Step1CountryPicker";
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
  const [state, setState] = useState<WizardState>(
    () => loadWizardState(clientId) ?? { step: 1 }
  );

  useEffect(() => {
    saveWizardState(clientId, state);
  }, [clientId, state]);

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
      navigate({ to: `/onboarding/${clientId}/studio` });
    }
  }

  function renderStep() {
    switch (state.step) {
      case 1:
        return (
          <Step1CountryPicker
            selectedIso={state.targetCountry}
            onSelect={(iso) => setState((s) => ({ ...s, targetCountry: iso }))}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <PlaceholderStep
            label="Brand Personality Picker"
            increment={2}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <PlaceholderStep
            label="Brand Brief Input"
            increment={3}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <PlaceholderStep
            label="3-Option Generation"
            increment={4}
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <TriveltaLogo size="md" withSubtitle={false} />

        <div className="flex flex-col items-center gap-1.5 flex-1 mx-8">
          <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
            Step {currentStepNum} of {TOTAL_STEPS}: {stepLabel}
          </span>
          <div className="w-full max-w-xs h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Back / Cancel control */}
        {state.step === 1 ? (
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
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

interface PlaceholderStepProps {
  label: string;
  increment: number;
  onBack: () => void;
  onNext: () => void;
}

function PlaceholderStep({ label, increment, onBack, onNext }: PlaceholderStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-10 text-center">
        <p className="text-zinc-400 text-sm">
          <span className="text-zinc-200 font-medium">{label}</span>
          {" "}— coming in Increment {increment}
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
