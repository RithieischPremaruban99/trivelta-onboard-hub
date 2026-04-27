/**
 * prospect-field-info.ts
 *
 * Structured field info registry for the prospect pre-onboarding form.
 * Keys match ProspectField.key values in prospect-fields.ts.
 * Each entry uses FieldInfoData (what / why / options / marketContext / recommendation).
 */

import type { FieldInfoData } from "@/components/onboarding/FieldInfoPopover";

export const PROSPECT_FIELD_INFO: Record<string, FieldInfoData> = {

  /* ─── Company & Contract ──────────────────────────────────── */

  legal_name: {
    what: "The full legal name of your registered company, exactly as it appears on your company registration certificate.",
    why: "Payment providers, regulators, and contract parties all require the exact legal name. Mismatches cause compliance rejections.",
  },

  registration_number: {
    what: "Your government-issued company registration number or tax identification number (e.g. RC123456 in Nigeria, EIN 12-3456789 in the US).",
    why: "Required by payment providers, banks, and gaming regulators to verify you are a legitimate registered business.",
  },

  trading_name: {
    what: "The brand name your platform operates under, if different from your legal name (e.g. 'BetStar' vs 'StarMedia Nigeria Ltd').",
    why: "Helps us configure your brand identity across the platform — logos, receipts, support messages all use the trading name.",
  },

  primary_contact_name: {
    what: "The name of the main person Trivelta's Account Manager will coordinate with during setup.",
    why: "Ensures communications go to the right decision-maker. This person will be invited to the shared Slack channel.",
  },

  primary_contact_email: {
    what: "The primary email address for all onboarding communications.",
    why: "This email receives all setup updates, integration credentials, and contract documents.",
  },

  business_country: {
    what: "The country where your company is legally registered and headquartered.",
    why: "Determines which banking rails, payment providers, and regulatory frameworks apply to your setup.",
  },

  target_markets: {
    what: "The countries where you plan to offer your platform to players.",
    why: "Each market has its own licensing requirements, payment expectations, and KYC standards. Your selection shapes the tech stack we configure for you.",
    marketContext: "Nigeria requires LSLB or NLRC license. South Africa requires a Provincial Gambling Board license. Kenya has strict deposit limit regulations. EU markets require Tier 3 KYC.",
    recommendation: "Start focused",
    recommendationReason: "Launching in 1-3 markets first reduces compliance overhead and speeds time-to-market. You can expand to additional markets after launch.",
  },

  current_platform: {
    what: "The betting/gaming platform you are currently operating on, if any.",
    why: "Helps Trivelta understand your migration needs and data transfer requirements.",
  },

  launch_timeframe: {
    what: "When you expect to go live with real-money operations.",
    why: "Allows Trivelta to schedule engineering sprints, license applications, and integration timelines accordingly.",
  },

  estimated_mau: {
    what: "Your expected number of monthly active users at launch.",
    why: "Determines the infrastructure sizing, support staffing, and payment volume thresholds needed from day one.",
  },

  /* ─── Payment Providers ───────────────────────────────────── */

  psps_needed: {
    what: "The payment service providers (PSPs) your players will use to deposit and withdraw funds.",
    why: "PSP selection determines which local payment methods are available, transaction fees, withdrawal speed, and which currencies you can accept.",
    options: [
      {
        label: "Paystack / Flutterwave",
        description: "Top-tier Nigerian/African PSPs. Cards, bank transfer, USSD, mobile money.",
        speed: "fast",
        risk: "low",
        cost: "medium",
        badge: "Most popular Africa",
      },
      {
        label: "M-Pesa / Cellulant",
        description: "Mobile money for East & West Africa. Required for Kenya, Tanzania, Uganda.",
        speed: "fast",
        risk: "low",
        cost: "low",
      },
      {
        label: "dLocal / EBANX",
        description: "LATAM-focused. Covers Brazil PIX, Mexico OXXO, Colombia PSE.",
        speed: "medium",
        risk: "low",
        cost: "medium",
        badge: "Most popular LATAM",
      },
      {
        label: "Crypto (Bitolo, Triple-A)",
        description: "Stablecoin and crypto deposits. Instant settlement, no chargebacks.",
        speed: "fast",
        risk: "medium",
        cost: "low",
      },
    ],
    marketContext: "Nigeria: Paystack + OPay recommended. Kenya: M-Pesa mandatory. Brazil: PIX required. Mexico: OXXO cash vouchers popular.",
    recommendation: "Select 2-3 providers",
    recommendationReason: "A primary PSP + 1 fallback ensures continuity when a provider has downtime. Avoid over-indexing on a single provider.",
  },

  expected_monthly_volume: {
    what: "Your projected total transaction value across all deposits and withdrawals per month.",
    why: "PSPs and banks require this for merchant account underwriting. Higher volume tiers unlock better rates and dedicated support.",
  },

  /* ─── KYC & Compliance ────────────────────────────────────── */

  kyc_tier: {
    what: "The depth of identity verification required before players can deposit or withdraw.",
    why: "Stricter verification reduces fraud and satisfies regulators, but adds friction that reduces sign-up conversion.",
    options: [
      {
        label: "Tier 1 — Basic",
        description: "Email + phone only. No documents required.",
        speed: "fast",
        risk: "high",
        cost: "low",
      },
      {
        label: "Tier 2 — Standard",
        description: "Adds government ID document upload. Most common for iGaming.",
        speed: "medium",
        risk: "medium",
        cost: "medium",
        badge: "Most common",
      },
      {
        label: "Tier 3 — Enhanced",
        description: "Adds proof-of-address + liveness check (video selfie). Required in EU.",
        speed: "slow",
        risk: "low",
        cost: "high",
      },
      {
        label: "Use Trivelta default",
        description: "Trivelta configures the optimal tier based on your markets and license.",
        speed: "medium",
        risk: "medium",
        cost: "medium",
        badge: "Recommended",
      },
    ],
    marketContext: "Most African markets accept Tier 2. South Africa increasingly requires Tier 3 for large transactions. EU regulators mandate Tier 3 for all operations.",
    recommendation: "Tier 2 — Standard",
    recommendationReason: "Best balance of conversion rate and compliance for African/LATAM markets. You can escalate to Tier 3 for high-value players.",
  },

  kyc_provider: {
    what: "The third-party vendor that handles identity document verification and biometric checks.",
    why: "KYC provider choice affects accuracy on local IDs, integration speed, pricing, and regulatory audit trail quality.",
    options: [
      {
        label: "Surt (recommended)",
        description: "Mobile-first, built for Africa + LATAM. 90-second full KYC flow. Trivelta's preferred partner.",
        speed: "fast",
        risk: "low",
        cost: "medium",
        badge: "Trivelta partner",
      },
      {
        label: "Smile ID",
        description: "Specialises in African ID verification with high accuracy on Nigerian, Ghanaian, and Kenyan IDs.",
        speed: "fast",
        risk: "low",
        cost: "medium",
      },
      {
        label: "Onfido / Persona",
        description: "Global providers. Strong on European passports and US IDs. Higher cost for African markets.",
        speed: "medium",
        risk: "low",
        cost: "high",
      },
    ],
    marketContext: "Surt and Smile ID have the highest accuracy on African national ID cards and voter's cards. For LATAM markets, Surt and Persona are both reliable.",
    recommendation: "Surt",
    recommendationReason: "Trivelta has a direct integration with Surt. Fastest time-to-live with pre-negotiated rates for our clients.",
  },

  license_status: {
    what: "Whether your operating license is active, being applied for, or not yet started.",
    why: "License status determines whether you can accept real-money bets at launch. Trivelta can proceed with integration in parallel with your application.",
    options: [
      {
        label: "Held — Active",
        description: "License is granted. You can process real-money bets from day one.",
        speed: "fast",
        risk: "low",
        cost: "low",
        badge: "Go-live ready",
      },
      {
        label: "In Application",
        description: "Paperwork is filed. Integration work can proceed; real-money ops wait for approval.",
        speed: "medium",
        risk: "medium",
        cost: "medium",
      },
      {
        label: "Not yet started",
        description: "Trivelta supports you through the application. Typically 3-6 months to approval.",
        speed: "slow",
        risk: "high",
        cost: "high",
      },
    ],
    marketContext: "Nigerian LSLB license: 3-4 months. Malta MGA: 4-6 months. Curacao: 6-8 weeks. South Africa NGCB: 6-12 months.",
    recommendation: "Start application immediately",
    recommendationReason: "License applications run in parallel with platform setup. Starting them now prevents delays at launch.",
  },

  license_jurisdiction: {
    what: "The regulatory body that issues your operating license.",
    why: "Jurisdiction determines tax rates, player protection requirements, and the markets you can legally serve.",
    marketContext: "Nigeria LSLB (Lagos) or NLRC (national). South Africa NGCB. Kenya BCLB. Malta MGA for EU access. Curacao for flexible multi-market operation.",
    recommendation: "Match your primary market",
    recommendationReason: "Choose the jurisdiction that covers your largest player market first. You can hold multiple licenses for different regions.",
  },

  /* ─── Marketing Stack ─────────────────────────────────────── */

  affiliate_marketing_existing: {
    what: "Whether you already have an affiliate program or tracking system in place.",
    why: "Existing affiliate systems need to be integrated with your new platform to preserve affiliate relationships and commissions.",
  },

  affiliate_marketing_system: {
    what: "The affiliate tracking and management platform you currently use.",
    why: "Trivelta's team will connect your affiliate system to the new platform to ensure seamless tracking and payouts.",
  },

  braze_account: {
    what: "Braze is the customer engagement platform used for CRM, push notifications, and email campaigns.",
    why: "Player retention depends heavily on timely, personalised communications. Braze powers automated lifecycle campaigns (first deposit, churn prevention, etc).",
    options: [
      {
        label: "New — Trivelta sets up",
        description: "Trivelta provisions a Braze workspace configured for your markets and player segments.",
        speed: "medium",
        risk: "low",
        cost: "medium",
        badge: "Easiest",
      },
      {
        label: "Existing — share credentials",
        description: "You already have Braze. Trivelta connects it to the new platform.",
        speed: "fast",
        risk: "low",
        cost: "low",
      },
      {
        label: "Not using Braze",
        description: "We can discuss alternative CRM solutions during onboarding.",
        speed: "medium",
        risk: "medium",
        cost: "medium",
      },
    ],
  },

  /* ─── Technical Requirements ──────────────────────────────── */

  geolocation_needed: {
    what: "Whether your platform needs to check a player's location before allowing access.",
    why: "Regulatory licenses are territory-specific. Geolocation blocks players from unlicensed markets and protects your license from violations.",
    options: [
      {
        label: "Yes",
        description: "Block players outside your licensed territories. Required by most regulators.",
        speed: "medium",
        risk: "low",
        cost: "low",
        badge: "Recommended",
      },
      {
        label: "No",
        description: "No location checks. Risky if your license is territory-specific.",
        speed: "fast",
        risk: "high",
        cost: "low",
      },
    ],
    recommendation: "Yes — enable geolocation",
    recommendationReason: "Most gaming licenses require geo-blocking of unlicensed territories. The cost is minimal; the compliance risk of not having it is high.",
  },

  dns_provider: {
    what: "The company that manages your domain's DNS records (e.g. Cloudflare, GoDaddy, AWS Route 53).",
    why: "Trivelta needs DNS access to configure CDN, SSL certificates, and platform subdomains during setup.",
  },

  domain_owned: {
    what: "Whether you have already purchased and own the domain name for your platform.",
    why: "Domain availability affects launch timeline. If not yet owned, we recommend purchasing it immediately to avoid squatters.",
  },

  domain_name: {
    what: "The URL of your platform (e.g. betexample.com).",
    why: "Your domain is the entry point for all players. It needs to be configured for SSL, CDN, and app linking.",
  },

  custom_integrations: {
    what: "Any third-party APIs, bespoke features, or existing systems that need to connect to the platform.",
    why: "Custom integrations require scoping and may affect launch timelines. Early disclosure allows Trivelta to plan development sprints.",
  },

  /* ─── Additional Features ──────────────────────────────────── */

  custom_features: {
    what: "Unique features specific to your market or player audience that aren't part of the standard Trivelta platform.",
    why: "Custom features are scoped and priced separately. Sharing them early allows inclusion in your project timeline.",
  },

  questions_for_us: {
    what: "Any questions you want Trivelta to address before finalising the contract.",
    why: "Clearing questions early prevents surprises after signing and builds confidence in the engagement.",
  },
};
