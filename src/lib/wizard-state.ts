import type { WizardState } from "@/components/studio/wizard/wizard-types";

const WIZARD_STORAGE_PREFIX = "wizard-state";

export function loadWizardState(clientId: string): WizardState | null {
  try {
    const raw = localStorage.getItem(`${WIZARD_STORAGE_PREFIX}-${clientId}`);
    if (!raw) return null;
    return JSON.parse(raw) as WizardState;
  } catch {
    return null;
  }
}

export function saveWizardState(clientId: string, state: WizardState): void {
  try {
    localStorage.setItem(
      `${WIZARD_STORAGE_PREFIX}-${clientId}`,
      JSON.stringify(state)
    );
  } catch {
    // localStorage full or disabled — fail silently, wizard works in-memory
  }
}

export function clearWizardState(clientId: string): void {
  try {
    localStorage.removeItem(`${WIZARD_STORAGE_PREFIX}-${clientId}`);
  } catch {
    // ignore
  }
}
