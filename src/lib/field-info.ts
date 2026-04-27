export interface FieldInfoLink {
  label: string;
  url: string;
}

export interface FieldInfoFeature {
  title: string;
  description: string;
}

export interface FieldInfo {
  tooltip: string;
  /** Short paragraph shown at the top of the panel (replaces learnMore as primary body) */
  summary?: string;
  /** Structured feature/benefit cards */
  features?: FieldInfoFeature[];
  /** Bullet-point use cases */
  useCases?: string[];
  /** Italic callout note at the bottom of the panel */
  notes?: string;
  /** Legacy long-form text (still rendered if no summary/features) */
  learnMore?: string;
  learnMoreLinks?: FieldInfoLink[];
}

// Keys match ProspectField.key values and FieldGroup / SubCard fieldKey props.
// Add an entry here to activate the (i) icon on any field - it silently no-ops
// when the key is absent, so it is safe to wire every field incrementally.

const PSP_LINKS = [
  { label: "Paystack", url: "https://paystack.com" },
  { label: "Opay", url: "https://opayweb.com" },
  { label: "PalmPay", url: "https://www.palmpay.com" },
  { label: "Aeropay", url: "https://aeropay.com" },
  { label: "Finix", url: "https://finix.com" },
  { label: "NMI", url: "https://www.nmi.com" },
  { label: "Worldpay", url: "https://www.worldpay.com" },
  { label: "Bitolo", url: "https://bitolo.com" },
  { label: "Evervault", url: "https://evervault.com" },
];

export const FIELD_INFO: Record<string, FieldInfo> = {
  target_markets: {
    tooltip: "The countries where you plan to offer your platform to players.",
    learnMore:
      "Each target market has its own licensing requirements, tax treatment, and payment method expectations. Nigeria requires a state or federal gaming license, South Africa requires a provincial license and KYC meeting POPIA standards, Kenya has strict deposit-limit regulations. The markets you select shape your licensing paperwork, payment integrations, and compliance obligations. You can add more markets later, but the initial selection determines your go-live tech stack.",
  },

  kyc_tier: {
    tooltip: "How strict your identity verification must be - stricter means better fraud protection but slower sign-up.",
    learnMore:
      "KYC (Know Your Customer) is the process of verifying a player's identity before allowing deposits or withdrawals. Tier 1 (basic) requires email and phone verification - fast but higher fraud risk. Tier 2 (standard) adds government ID document upload and is the most common requirement. Tier 3 (enhanced) adds address proof and liveness check (video selfie) for regulated markets or high-risk users. Most African markets require Tier 2. South Africa and EU markets often require Tier 3 for certain transactions.",
  },

  // Used by prospect form (field.key = "license_status")
  license_status: {
    tooltip: "Whether your operating license is already active, still being applied for, or not yet started.",
    learnMore:
      "To legally operate an iGaming platform, you need a gambling license from the jurisdiction where you target players. 'Active' means the license is granted and you can process real-money bets at launch. 'In Application' means paperwork is filed and you're awaiting approval - integration work can proceed in parallel, but real-money operations wait for approval. 'Not yet started' means Trivelta will support you through the application process, which typically takes 3-6 months depending on the jurisdiction.",
  },

  license_jurisdiction: {
    tooltip: "The regulatory authority that grants your operating license.",
    learnMore:
      "Your license jurisdiction determines tax obligations, player protection rules, and the markets you can legally serve. Common choices: Nigeria's LSLB (Lagos State) or NLRC (national) for West Africa, South Africa's National Gambling Board for SA, Malta's MGA for Europe, Curacao eGaming for flexible multi-market operation. Each has different cost structures and approval timelines. Jurisdiction also affects which payment providers, KYC vendors, and advertising channels you can use.",
  },

  // Used by client form SubCard "Payment service providers *"
  payment_service_providers: {
    tooltip: "The payment companies who will handle deposits and withdrawals from your players.",
    summary:
      "A PSP (Payment Service Provider) is the bridge between your platform and your players' banks or mobile money accounts. Your selection determines what currencies you can accept, which local payment methods are available, and how fast withdrawals clear.",
    features: [
      {
        title: "Local payment methods",
        description: "M-Pesa, USSD, mobile money, and local card schemes - each PSP has different geographic coverage.",
      },
      {
        title: "Transaction fees",
        description: "Rates vary by PSP, volume, and country. Trivelta helps you negotiate directly with providers.",
      },
      {
        title: "Withdrawal speed",
        description: "Instant payouts build player trust. African PSPs like Paystack and Opay settle in minutes.",
      },
    ],
    notes:
      "Your selected PSPs are prioritized during platform setup. You can add more providers after launch.",
    learnMoreLinks: PSP_LINKS,
  },

  // Alias for prospect form (field.key = "psps_needed")
  psps_needed: {
    tooltip: "The payment companies who will handle deposits and withdrawals from your players.",
    summary:
      "A PSP (Payment Service Provider) is the bridge between your platform and your players' banks or mobile money accounts. Your selection determines what currencies you can accept, which local payment methods are available, and how fast withdrawals clear.",
    features: [
      {
        title: "Local payment methods",
        description: "M-Pesa, USSD, mobile money, and local card schemes - each PSP has different geographic coverage.",
      },
      {
        title: "Transaction fees",
        description: "Rates vary by PSP, volume, and country. Trivelta helps you negotiate directly with providers.",
      },
      {
        title: "Withdrawal speed",
        description: "Instant payouts build player trust. African PSPs like Paystack and Opay settle in minutes.",
      },
    ],
    notes:
      "Your selected PSPs are prioritized during platform setup. You can add more providers after launch.",
    learnMoreLinks: PSP_LINKS,
  },

  duns_number: {
    tooltip: "A unique 9-digit business ID issued by Dun and Bradstreet, used to verify your company with payment providers.",
    summary:
      "DUNS (Data Universal Numbering System) is a globally recognized business identifier - essentially a business version of a national ID number. Payment providers, banks, and regulators use it to confirm your company exists and link financial records.",
    useCases: [
      "Required by major PSPs to approve merchant accounts",
      "Banks and regulators use it to verify your business identity",
      "Free to obtain at dnb.com - typically issued within 30 days",
    ],
    notes:
      "If you don't have a DUNS yet, some payment integrations can proceed in parallel while your application is in progress. Trivelta will flag this during setup.",
    learnMoreLinks: [
      { label: "Dun & Bradstreet", url: "https://www.dnb.com/duns/get-a-duns.html" },
    ],
  },

  zendesk_account: {
    tooltip: "Your customer support helpdesk software where player tickets are managed.",
    summary:
      "Zendesk is an industry-standard customer service platform that centralizes player support - tickets, live chat, knowledge base, and escalation workflows.",
    features: [
      {
        title: "Automatic player context",
        description: "Support agents see account ID, deposit history, and active bets without asking players to repeat themselves.",
      },
      {
        title: "Regulatory requirement",
        description: "Regulators audit response times during license renewals. An operational support channel before launch is non-negotiable.",
      },
    ],
    learnMoreLinks: [
      { label: "Zendesk", url: "https://www.zendesk.com" },
    ],
  },

  kyc_surt_integration: {
    tooltip: "A premium identity verification platform specializing in fast, high-accuracy KYC for regulated industries.",
    summary:
      "Surt is a modern KYC provider built for regulated financial services and iGaming. It handles document verification, biometric face-matching, liveness detection, and continuous monitoring - all through a single API.",
    features: [
      {
        title: "Emerging market accuracy",
        description: "Performs especially well with African IDs, LATAM nacional IDs, and Asian passports where legacy providers often struggle.",
      },
      {
        title: "Mobile-first flow",
        description: "A player can complete full KYC in under 90 seconds on a smartphone - optimized to minimize drop-off.",
      },
      {
        title: "Continuous monitoring",
        description: "Ongoing watchlist screening and re-verification triggers, not just a one-time check at sign-up.",
      },
    ],
    notes:
      "Trivelta works directly with Surt and can configure their platform specifically for your target markets and risk tolerance.",
    learnMoreLinks: [
      { label: "Surt website", url: "https://surt.com" },
      { label: "Contact Surt directly", url: "mailto:contact@surt.com" },
    ],
  },

  advertising_pixels: {
    tooltip: "Tracking codes from ad platforms (Facebook, Google, TikTok) that measure which ads bring paying players.",
    learnMore:
      "When you run paid acquisition campaigns, you need to know which ads actually convert into depositing players. Advertising pixels (also known as tracking codes) are JavaScript snippets from ad platforms that fire when a user signs up, makes a first deposit, or hits any conversion event. Without pixels you can't optimize ad spend - you're guessing. Trivelta installs pixels for Facebook, Google, TikTok, Twitter, and affiliate networks during setup. You provide the pixel IDs (found in your respective ad account dashboards) and your campaigns start attributing conversions immediately.",
    learnMoreLinks: [
      { label: "Meta / Facebook Pixel", url: "https://www.facebook.com/business/tools/meta-pixel" },
      { label: "Google Ads", url: "https://ads.google.com" },
      { label: "TikTok for Business", url: "https://ads.tiktok.com" },
    ],
  },
};

