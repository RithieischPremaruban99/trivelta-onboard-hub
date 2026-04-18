// All field-level definitions for the onboarding form, in one place.

export const COUNTRIES = [
  "Nigeria", "Kenya", "Ghana", "South Africa", "Tanzania", "Uganda",
  "Cameroon", "Senegal", "Ivory Coast", "Brazil", "Mexico", "Colombia",
  "Peru", "Argentina", "Other",
];

export type ContactBlock = { name: string; email: string; phone: string };

export type FormShape = {
  // Section 1
  contact_sportsbook: ContactBlock;
  contact_operational: ContactBlock;
  contact_compliance: ContactBlock;
  slack_team_emails: string;

  // Section 2
  logo_drive_link: string;
  icon_drive_link: string;
  animation_drive_link: string;

  // Section 3
  platform_url: string;
  country: string;
  dns_provider: string;
  dns_access: "yes" | "no" | "";
  color_background: string;
  color_primary: string;
  color_secondary: string;
  color_light_text: string;
  color_placeholder: string;
  btn_gradient_a: string;
  btn_gradient_b: string;
  box_gradient_a: string;
  box_gradient_b: string;
  header_gradient_a: string;
  header_gradient_b: string;
  won_gradient_a: string;
  won_gradient_b: string;

  // Section 4
  footer_required: "yes" | "no" | "";
  landing_page: "yes" | "no" | "";
  terms_url: string;
  privacy_url: string;
  rg_url: string;
  landing_page_url: string;

  // Section 5
  psp_opay: boolean;
  psp_palmpay: boolean;
  psp_paystack: boolean;
  psp_priority: string;
  kyc_surt: "yes" | "no" | "";
  kyc_notes: string;
  sms_provider: "infobip" | "other" | "";
  sms_provider_other: string;
  duns_status: "have" | "in_progress" | "none" | "";
  duns_number: string;
  zendesk: "yes" | "no" | "";
  zendesk_script: string;
  analytics_meta: boolean;
  analytics_ga: boolean;
  analytics_gtm: boolean;
  analytics_snapchat: boolean;
  analytics_reddit: boolean;
};

export const emptyContact = (): ContactBlock => ({ name: "", email: "", phone: "" });

export const emptyForm = (defaults?: Partial<FormShape>): FormShape => ({
  contact_sportsbook: emptyContact(),
  contact_operational: emptyContact(),
  contact_compliance: emptyContact(),
  slack_team_emails: "",
  logo_drive_link: "",
  icon_drive_link: "",
  animation_drive_link: "",
  platform_url: "",
  country: "",
  dns_provider: "",
  dns_access: "",
  color_background: "#0a0d14",
  color_primary: "#3b82f6",
  color_secondary: "#1f2937",
  color_light_text: "#f9fafb",
  color_placeholder: "#9ca3af",
  btn_gradient_a: "#3b82f6",
  btn_gradient_b: "#1d4ed8",
  box_gradient_a: "#111827",
  box_gradient_b: "#0a0d14",
  header_gradient_a: "#111827",
  header_gradient_b: "#0a0d14",
  won_gradient_a: "#22c55e",
  won_gradient_b: "#15803d",
  footer_required: "",
  landing_page: "",
  terms_url: "",
  privacy_url: "",
  rg_url: "",
  landing_page_url: "",
  psp_opay: false,
  psp_palmpay: false,
  psp_paystack: false,
  psp_priority: "",
  kyc_surt: "",
  kyc_notes: "",
  sms_provider: "",
  sms_provider_other: "",
  duns_status: "",
  duns_number: "",
  zendesk: "",
  zendesk_script: "",
  analytics_meta: false,
  analytics_ga: false,
  analytics_gtm: false,
  analytics_snapchat: false,
  analytics_reddit: false,
  ...defaults,
});

const isContactComplete = (c: ContactBlock) => !!(c.name && c.email && c.phone);

// Required-field validators per section
export const validators: Record<number, (f: FormShape) => boolean> = {
  1: (f) =>
    isContactComplete(f.contact_sportsbook) &&
    isContactComplete(f.contact_operational) &&
    isContactComplete(f.contact_compliance),
  2: (f) => !!(f.logo_drive_link && f.icon_drive_link),
  3: (f) => !!(f.platform_url && f.country && f.dns_provider && f.dns_access),
  4: (f) =>
    !!(
      f.footer_required &&
      f.landing_page &&
      f.terms_url &&
      f.privacy_url &&
      f.rg_url &&
      (f.landing_page === "no" || f.landing_page_url)
    ),
  5: (f) => {
    const pspOk = f.psp_opay || f.psp_palmpay || f.psp_paystack;
    const smsOk = f.sms_provider === "infobip" || (f.sms_provider === "other" && !!f.sms_provider_other);
    return !!(pspOk && f.kyc_surt && smsOk && f.duns_status && f.zendesk);
  },
};

export const isFormComplete = (f: FormShape) =>
  validators[1](f) && validators[2](f) && validators[3](f) && validators[4](f) && validators[5](f);
