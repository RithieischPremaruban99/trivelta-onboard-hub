export interface ClientProgressInput {
  hasOnboardingForm: boolean;
  formHasData: boolean;
  formSubmitted: boolean;
  studioStarted: boolean;
  studioLocked: boolean;
  platformLive: boolean;
}

export function calculateProgress(input: ClientProgressInput): number {
  const milestones = [
    input.hasOnboardingForm && input.formHasData, // Form Started
    input.formSubmitted,                           // Form Submitted
    input.studioStarted,                           // Studio Started
    input.studioLocked,                            // Studio Locked
    input.platformLive,                            // Platform Live
  ];
  const completed = milestones.filter(Boolean).length;
  return Math.round((completed / 5) * 100);
}

export function getProgressLabel(percent: number): string {
  if (percent === 100) return "Launched";
  if (percent >= 80) return "Final setup";
  if (percent >= 60) return "Design locked";
  if (percent >= 40) return "Form submitted";
  if (percent >= 20) return "In progress";
  if (percent > 0) return "Just created";
  return "Not started";
}

export function getMilestoneList(input: ClientProgressInput): Array<{
  label: string;
  completed: boolean;
  order: number;
}> {
  return [
    { label: "Form Started", completed: input.hasOnboardingForm && input.formHasData, order: 1 },
    { label: "Form Submitted", completed: input.formSubmitted, order: 2 },
    { label: "Studio Started", completed: input.studioStarted, order: 3 },
    { label: "Studio Locked", completed: input.studioLocked, order: 4 },
    { label: "Platform Live", completed: input.platformLive, order: 5 },
  ];
}
