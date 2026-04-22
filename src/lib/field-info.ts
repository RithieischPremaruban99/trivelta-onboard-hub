export interface FieldInfo {
  tooltip: string;
  learnMore?: string;
  learnMoreLinks?: Array<{ label: string; url: string }>;
}

// Keys match ProspectField.key values and FieldGroup fieldKey props.
// Content will be populated in a later step — add entries here to activate
// the (i) icon on any field.
export const FIELD_INFO: Record<string, FieldInfo> = {
  // Example (placeholder — will be replaced with real content):
  duns_number: {
    tooltip: "A unique 9-digit business identifier issued by Dun & Bradstreet.",
    learnMore:
      "DUNS (Data Universal Numbering System) is a globally recognised business identity number used by financial institutions, government bodies, and enterprise procurement systems to verify your company's legitimacy.\n\nObtaining a DUNS number is free and typically takes 1–5 business days. Once issued, it never changes — it follows the company, not an individual.",
    learnMoreLinks: [
      { label: "Apply for free at Dun & Bradstreet", url: "https://www.dnb.com/duns" },
    ],
  },
};
