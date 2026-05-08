import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { supabase } from "@/integrations/supabase/client";
import { loadWizardState, saveWizardState } from "@/lib/wizard-state";
import { Step1CountryPicker } from "./Step1CountryPicker";
import { Step2BrandIdentityChoice } from "./Step2BrandIdentityChoice";
import { Step2PersonalityPicker } from "./Step2PersonalityPicker";
import { Step3BriefInput } from "./Step3BriefInput";
import { Step4ThreeOptions } from "./Step4ThreeOptions";
import type { BrandIdentityChoice, WizardState, WizardStep } from "./wizard-types";
import { getTotalSteps } from "./wizard-types";

interface Props {
  clientId: string;
}

const STEP_LABELS: Record<number, { logo: string; fresh: string }> = {
  1: { logo: "Where will you launch?",              fresh: "Where will you launch?" },
  2: { logo: "How do you want to define your brand?", fresh: "How do you want to define your brand?" },
  3: { logo: "Tell us about your brand",            fresh: "Choose your brand style" },
  4: { logo: "Choose your options",                 fresh: "Tell us about your brand" },
  5: { logo: "",                                    fresh: "Choose your options" },
};

function getDisplayStepNumber(state: WizardState): number {
  const step = typeof state.step === "number" ? state.step : 4;

  // Fresh path: stages 1-5 directly map
  if (state.brandIdentityChoice === "fresh") {
    return step;
  }

  // Logo path: stages 1, 2, 4, 5 (skips 3=Personality)
  // Internally steps 1, 2, 3, 4 — map step 3 → 4, step 4 → 5
  if (state.brandIdentityChoice === "logo") {
    if (step <= 2) return step;
    if (step === 3) return 4;
    if (step === 4) return 5;
    return step;
  }

  return step;
}

function getStepLabel(state: WizardState): string {
  const path = state.brandIdentityChoice === "fresh" ? "fresh" : "logo";
  return STEP_LABELS[state.step as number]?.[path] ?? "";
}

export function WizardLayout({ clientId }: Props) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { regenerate?: string };
  const isRegenerateMode = search.regenerate === "true";

  const [state, setState] = useState<WizardState>({ step: 1 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadWizardState(clientId);
    if (stored) setState(stored);
    setHydrated(true);
  }, [clientId]);

  // Prefill from existing studio_config when in regenerate mode
  useEffect(() => {
    if (!isRegenerateMode || !clientId) return;

    (async () => {
      const { data, error } = await supabase
        .from("onboarding_forms")
        .select("studio_config")
        .eq("client_id", clientId)
        .maybeSingle();

      if (error || !data?.studio_config) return;

      const saved = data.studio_config as any;
      const ctx = saved.brandContext;

      // Determine path and target step based on prefilled data completeness
      const hasLogo = !!saved.logoUrl;
      const hasPersonality = !!ctx?.targetPersonality;
      const hasCountry = !!ctx?.targetCountry;
      const hasBrief = !!saved.brandPromptHistory?.[0]?.prompt;

      // Jump to Brief step if enough context is prefilled (user adjusts + regenerates)
      // Logo path: step 3 = Brief+Logo; Fresh path: step 4 = Brief
      let targetStep: WizardStep = 1;
      if (hasCountry && (hasLogo || hasPersonality) && hasBrief) {
        targetStep = hasLogo ? 3 : 4;
      } else if (hasCountry && (hasLogo || hasPersonality)) {
        targetStep = hasLogo ? 3 : 4;
      } else if (hasCountry) {
        targetStep = 2;
      }

      setState((prev) => ({
        ...prev,
        step: targetStep,
        ...(ctx?.targetCountry && { targetCountry: ctx.targetCountry }),
        isMultiMarket: ctx?.isMultiMarket ?? false,
        ...(ctx?.targetPersonality && { targetPersonality: ctx.targetPersonality }),
        ...(ctx?.targetPlatformType && { targetPlatformType: ctx.targetPlatformType }),
        ...(saved.brandPromptHistory?.[0]?.prompt && {
          brandPrompt: saved.brandPromptHistory[0].prompt,
        }),
        brandIdentityChoice: hasLogo ? "logo" : (hasPersonality ? "fresh" : undefined),
        ...(saved.logoUrl && { logoUrl: saved.logoUrl }),
      }));
    })();
  }, [isRegenerateMode, clientId]);

  useEffect(() => {
    if (!hydrated) return;
    saveWizardState(clientId, state);
  }, [clientId, state, hydrated]);

  const totalSteps = getTotalSteps(state);
  const currentStepNum = getDisplayStepNumber(state);
  const progressPct = (currentStepNum / totalSteps) * 100;
  const stepLabel = getStepLabel(state);

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
    // Use REAL max step per path, not the display total
    // Logo path has 4 actual steps (skips Personality)
    // Fresh path has 5 actual steps
    const realMaxStep = state.brandIdentityChoice === "fresh" ? 5 : 4;

    if (typeof state.step === "number" && state.step < realMaxStep) {
      setState({ ...state, step: (state.step + 1) as WizardStep });
    } else {
      setState({ ...state, step: "complete" });
      navigate({ to: `/studio-preview/${clientId}` });
    }
  }

  function handleBrandIdentityChoice(choice: BrandIdentityChoice) {
    setState({
      ...state,
      brandIdentityChoice: choice,
      ...(choice === "logo" && { targetPersonality: undefined }),
      ...(choice === "fresh" && { logoUrl: undefined }),
    });
  }

  function renderStep() {
    if (state.step === 1) {
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
    }

    if (state.step === 2) {
      return (
        <Step2BrandIdentityChoice
          selectedChoice={state.brandIdentityChoice}
          onSelect={handleBrandIdentityChoice}
          onBack={handleBack}
          onNext={handleNext}
        />
      );
    }

    // Steps 3+ branch by brandIdentityChoice
    if (state.brandIdentityChoice === "fresh") {
      // Fresh path: 5 steps — Step 3 = Personality, Step 4 = Brief, Step 5 = Options
      if (state.step === 3) {
        return (
          <Step2PersonalityPicker
            selectedPersonality={state.targetPersonality}
            selectedPlatformType={state.targetPlatformType}
            onSelectPersonality={(p) => setState((s) => ({ ...s, targetPersonality: p }))}
            onSelectPlatformType={(pt) => setState((s) => ({ ...s, targetPlatformType: pt }))}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      }
      if (state.step === 4) {
        return (
          <Step3BriefInput
            clientId={clientId}
            brandPrompt={state.brandPrompt ?? ""}
            logoUrl={state.logoUrl}
            selectedCountry={state.targetCountry}
            isMultiMarket={state.isMultiMarket ?? false}
            selectedPersonality={state.targetPersonality}
            selectedPlatformType={state.targetPlatformType}
            onChangeBrief={(text) => setState((s) => ({ ...s, brandPrompt: text }))}
            onLogoUploaded={(url) => setState((s) => ({ ...s, logoUrl: url }))}
            onLogoRemoved={() => setState((s) => ({ ...s, logoUrl: undefined }))}
            onBack={handleBack}
            onNext={handleNext}
            pathChoice="fresh"
          />
        );
      }
      if (state.step === 5) {
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
      }
    }

    if (state.brandIdentityChoice === "logo") {
      // Logo path: 4 steps — Step 3 = Brief + Logo, Step 4 = Options
      if (state.step === 3) {
        return (
          <Step3BriefInput
            clientId={clientId}
            brandPrompt={state.brandPrompt ?? ""}
            logoUrl={state.logoUrl}
            selectedCountry={state.targetCountry}
            isMultiMarket={state.isMultiMarket ?? false}
            selectedPersonality={state.targetPersonality}
            selectedPlatformType={state.targetPlatformType}
            onChangeBrief={(text) => setState((s) => ({ ...s, brandPrompt: text }))}
            onLogoUploaded={(url) => setState((s) => ({ ...s, logoUrl: url }))}
            onLogoRemoved={() => setState((s) => ({ ...s, logoUrl: undefined }))}
            onBack={handleBack}
            onNext={handleNext}
            pathChoice="logo"
          />
        );
      }
      if (state.step === 4) {
        return (
          <Step4ThreeOptions
            clientId={clientId}
            brandPrompt={state.brandPrompt ?? ""}
            logoUrl={state.logoUrl}
            selectedCountry={state.targetCountry}
            isMultiMarket={state.isMultiMarket ?? false}
            selectedPlatformType={state.targetPlatformType}
            // Logo path has no personality step; logo-mode override in Step4 ignores it anyway
            selectedPersonality={state.targetPersonality ?? "modern-crypto"}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      }
    }

    // Fallback: brandIdentityChoice not yet set but step > 2 (shouldn't happen in normal flow)
    return (
      <div className="text-center text-zinc-400 text-sm py-10">
        Please go back and select an identity option.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <TriveltaLogo size="xl" brandSuffix="AI" product="Studio" />

        <div className="flex flex-col items-center gap-1.5 flex-1 mx-8">
          <span className="micro-label">
            Step {currentStepNum} of {totalSteps}: {stepLabel}
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
