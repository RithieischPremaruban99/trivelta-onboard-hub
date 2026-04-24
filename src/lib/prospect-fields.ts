import { KYC_PROVIDERS } from "./kyc-providers";
import type { KycProvider } from "./kyc-providers";

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "multi_select"
  | "textarea"
  | "boolean_tri"; // tri = yes / no / maybe

export interface ProspectField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  options?: string[];
  required?: boolean; // display hint only - all fields are truly optional
  /** When set, an amber disclaimer is shown if the user selects "Other" */
  otherDisclaimer?: "integration_launch_impact";
  /** When set, renders a rich select with description subtexts instead of native <select> */
  kycProviders?: KycProvider[];
}

export interface ProspectSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // lucide icon name
  storageKey:
    | "company_details"
    | "payment_providers"
    | "kyc_compliance"
    | "marketing_stack"
    | "technical_requirements"
    | "optional_features";
  fields: ProspectField[];
}

export const PROSPECT_SECTIONS: ProspectSection[] = [
  {
    id: "company",
    title: "Company & Contract",
    subtitle: "Who you are and where you're going",
    icon: "Building2",
    storageKey: "company_details",
    fields: [
      { key: "legal_name", label: "Legal Company Name", type: "text", required: true },
      {
        key: "registration_number",
        label: "Company Registration Number or Tax ID",
        type: "text",
        placeholder: "e.g. RC123456, EIN 12-3456789",
        required: true,
      },
      { key: "trading_name", label: "Trading Name / Brand", type: "text" },
      { key: "primary_contact_name", label: "Primary Contact Name", type: "text" },
      {
        key: "primary_contact_email",
        label: "Primary Contact Email",
        type: "email",
        required: true,
      },
      { key: "primary_contact_phone", label: "Primary Contact Phone", type: "phone" },
      { key: "business_country", label: "Business HQ Country", type: "text" },
      {
        key: "target_markets",
        label: "Target Markets",
        type: "multi_select",
        options: [
          // Africa
          "Nigeria",
          "Kenya",
          "DRC",
          "Tanzania",
          "South Africa",
          "Ghana",
          "Uganda",
          "Angola",
          "Mozambique",
          "Zimbabwe",
          "Zambia",
          "Namibia",
          "Rwanda",
          "Ethiopia",
          "Senegal",
          "Côte d'Ivoire",
          "Cameroon",
          "Botswana",
          "Egypt",
          "Morocco",
          // LATAM
          "Brazil",
          "Mexico",
          "Colombia",
          "Argentina",
          "Peru",
          "Chile",
          "Dominican Republic",
          "Panama",
          "Ecuador",
          "Uruguay",
          "Bolivia",
          "Paraguay",
          "Costa Rica",
          // Other
          "USA",
          "Other",
        ],
        helperText: "Where do you plan to operate?",
      },
      {
        key: "current_platform",
        label: "Current Platform (if any)",
        type: "select",
        options: [
          "New build - no existing platform",
          "Aardvark",
          "Advag",
          "SBTech",
          "Playtech",
          "BetConstruct",
          "Delasport",
          "BetRadar",
          "Other",
        ],
      },
      {
        key: "launch_timeframe",
        label: "Expected Launch Timeframe",
        type: "select",
        options: ["Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Later"],
      },
      {
        key: "estimated_mau",
        label: "Estimated Monthly Active Users at Launch",
        type: "select",
        options: [
          "Under 10k",
          "10k-50k",
          "50k-200k",
          "200k-500k",
          "500k-1M",
          "1M+",
        ],
      },
    ],
  },
  {
    id: "payments",
    title: "Payment Providers",
    subtitle: "How your users will deposit and withdraw",
    icon: "CreditCard",
    storageKey: "payment_providers",
    fields: [
      {
        key: "psps_needed",
        label: "Payment Providers Needed",
        type: "multi_select",
        otherDisclaimer: "integration_launch_impact",
        options: [
          "Paystack",
          "Opay",
          "PalmPay",
          "Aeropay",
          "Finix",
          "NMI",
          "Worldpay",
          "Bitolo",
          "Evervault",
          "Other",
        ],
      },
      {
        key: "current_psp_setup",
        label: "Current PSP Setup",
        type: "textarea",
        placeholder:
          "What are you using today? Any existing contracts we should know about?",
      },
      {
        key: "expected_monthly_volume",
        label: "Expected Monthly Transaction Volume",
        type: "select",
        options: [
          "Under $100k",
          "$100k-$500k",
          "$500k-$2M",
          "$2M-$10M",
          "$10M+",
        ],
      },
    ],
  },
  {
    id: "kyc",
    title: "KYC & Compliance",
    subtitle: "Identity verification and regulatory setup",
    icon: "ShieldCheck",
    storageKey: "kyc_compliance",
    fields: [
      {
        key: "kyc_tier",
        label: "KYC Tier Needed",
        type: "select",
        options: [
          "Basic (Tier 1) - minimal verification",
          "Full (Tier 2) - standard KYC with document upload",
          "Enhanced (Tier 3) - biometric + enhanced due diligence",
          "Use Trivelta default",
        ],
      },
      {
        key: "kyc_provider",
        label: "Preferred KYC Provider",
        type: "select",
        otherDisclaimer: "integration_launch_impact",
        kycProviders: KYC_PROVIDERS,
      },
      {
        key: "license_status",
        label: "Regulatory License Status",
        type: "select",
        options: [
          "Held",
          "In Application",
          "Pending jurisdiction decision",
          "Planning to apply",
          "Not yet started",
        ],
      },
      {
        key: "license_jurisdiction",
        label: "License Jurisdiction",
        type: "text",
        placeholder:
          "e.g. Lagos State Lotteries Board, Malta Gaming Authority",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing Stack",
    subtitle: "CRM and communication tools",
    icon: "Megaphone",
    storageKey: "marketing_stack",
    fields: [
      {
        key: "braze_account",
        label: "Braze Account",
        type: "select",
        options: [
          "New - need Trivelta to set up",
          "Existing - will share credentials",
          "Not using Braze",
        ],
      },
      {
        key: "infobip",
        label: "Infobip (SMS / Voice)",
        type: "select",
        options: [
          "Need Trivelta configuration",
          "Have own account",
          "Not using",
        ],
      },
      {
        key: "current_marketing_tool",
        label: "Current Marketing Automation Tool (if any)",
        type: "text",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical Requirements",
    subtitle: "Compliance, infrastructure, integrations",
    icon: "Wrench",
    storageKey: "technical_requirements",
    fields: [
      {
        key: "geolocation_needed",
        label: "Geolocation / IP Check Needed?",
        type: "boolean_tri",
        helperText: "For regulatory compliance - restrict access by location",
      },
      {
        key: "geolocation_justification",
        label: "Geolocation Justification (optional)",
        type: "textarea",
      },
      {
        key: "dns_provider",
        label: "DNS Provider",
        type: "select",
        options: [
          "GoDaddy",
          "Cloudflare",
          "Route 53 (AWS)",
          "Namecheap",
          "Other",
          "Don't know yet",
        ],
      },
      {
        key: "domain_owned",
        label: "Domain Already Owned?",
        type: "boolean_tri",
      },
      {
        key: "domain_name",
        label: "Domain Name",
        type: "text",
        placeholder: "e.g. betexample.com",
      },
      {
        key: "custom_integrations",
        label: "Custom Integrations Needed",
        type: "textarea",
        placeholder:
          "Third-party APIs, bespoke features, existing systems to connect...",
      },
    ],
  },
  {
    id: "optional",
    title: "Additional Features",
    subtitle: "Nice-to-haves and future considerations",
    icon: "Sparkles",
    storageKey: "optional_features",
    fields: [
      {
        key: "virtual_sports",
        label: "Virtual Sports",
        type: "boolean_tri",
      },
      {
        key: "betslip_simulation",
        label: "Betslip Simulation / Pre-bet Preview",
        type: "boolean_tri",
      },
      {
        key: "custom_features",
        label: "Other Features You'd Want",
        type: "textarea",
        placeholder: "Anything specific to your market or audience...",
      },
      {
        key: "questions_for_us",
        label: "Questions for Trivelta",
        type: "textarea",
        placeholder: "Anything you'd like us to address before contract?",
      },
    ],
  },
];

/* ── Progress calculation ─────────────────────────────────────────────────── */

type ProspectSections = {
  company_details?: Record<string, unknown>;
  payment_providers?: Record<string, unknown>;
  kyc_compliance?: Record<string, unknown>;
  marketing_stack?: Record<string, unknown>;
  technical_requirements?: Record<string, unknown>;
  optional_features?: Record<string, unknown>;
};

export function calculateProspectProgress(prospect: ProspectSections): number {
  const allFields = PROSPECT_SECTIONS.flatMap((s) =>
    s.fields.map((f) => ({ storageKey: s.storageKey, fieldKey: f.key })),
  );
  const totalFields = allFields.length;

  const filled = allFields.filter(({ storageKey, fieldKey }) => {
    const section = (prospect[storageKey] ?? {}) as Record<string, unknown>;
    const value = section[fieldKey];
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  return Math.round((filled / totalFields) * 100);
}
