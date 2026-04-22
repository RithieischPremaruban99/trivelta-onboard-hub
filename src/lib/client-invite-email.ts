export function buildClientInviteEmail(params: {
  contactName: string;
  inviteLink: string;
  amName: string;
  amEmail: string;
  studioAccessGranted: boolean;
}): { subject: string; body: string } {
  const firstName = params.contactName.split(" ")[0];

  const studioSection = params.studioAccessGranted
    ? "Once submitted, you'll unlock Trivelta Studio — our AI-powered platform design tool where you'll pick your colors, logo, and brand identity."
    : "Once submitted, your Account Manager will take over and guide you through the platform configuration.";

  const subject = "Welcome to Trivelta — Your platform setup starts now";

  const body = `Hi ${firstName},

Great news — your contract with Trivelta is signed. Welcome aboard.

Your next step: complete your platform onboarding.

We've already pre-filled a lot of the form with what you shared during our pre-onboarding conversation (payment providers, KYC setup, marketing stack, technical details).

Click below to pick up where we left off:

${params.inviteLink}

What you'll do next:
1. Review the pre-filled onboarding form (5–10 minutes)
2. Fill in the remaining sections (team contacts, legal, branding)
3. ${studioSection}

Your Account Manager, ${params.amName}, is your point of contact for anything you need. Reach them at ${params.amEmail}.

This link is unique to you. Don't share it publicly.

Welcome to the team,
The Trivelta Crew`;

  return { subject, body };
}
