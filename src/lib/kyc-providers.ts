export interface KycProvider {
  value: string;
  label: string;
  category: "identity" | "fraud" | "both";
  description?: string;
}

export const KYC_PROVIDERS: KycProvider[] = [
  { value: "jumio", label: "Jumio", category: "identity" },
  { value: "onfido", label: "Onfido", category: "identity" },
  { value: "veriff", label: "Veriff", category: "identity" },
  { value: "sumsub", label: "Sumsub", category: "both", description: "Identity + AML" },
  { value: "idnow", label: "IDnow", category: "identity" },
  { value: "shufti_pro", label: "Shufti Pro", category: "identity" },
  { value: "trulioo", label: "Trulioo", category: "identity" },
  { value: "persona", label: "Persona", category: "identity" },
  { value: "plaid", label: "Plaid", category: "both", description: "Identity + banking + income verification" },
  { value: "seon", label: "SEON", category: "fraud", description: "Fraud prevention + AML" },
  { value: "iovation", label: "iovation (TransUnion)", category: "fraud" },
  { value: "socure", label: "Socure", category: "identity" },
  { value: "alloy", label: "Alloy", category: "both" },
  { value: "in_house", label: "In-house / Custom", category: "both" },
  { value: "other", label: "Other (specify in notes)", category: "both" },
  { value: "none_yet", label: "No provider selected yet", category: "both" },
];
