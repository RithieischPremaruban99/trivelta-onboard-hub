export interface FieldInfo {
  tooltip: string;
  learnMore?: string;
  learnMoreLinks?: Array<{ label: string; url: string }>;
}

// Keys match ProspectField.key values and FieldGroup / SubCard fieldKey props.
// Add an entry here to activate the (i) icon on any field — it silently no-ops
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
    learnMore:
      "A PSP (Payment Service Provider) is the bridge between your platform and your players' banks or mobile money accounts. The PSP determines what currencies you accept, withdrawal speeds, transaction fees, and which local payment methods (M-Pesa, cards, USSD) are available. Trivelta has direct integrations with leading African PSPs including Paystack, Opay, PalmPay, and Aeropay, plus global providers like Worldpay and NMI. Your selected PSPs will be prioritized during platform setup.",
    learnMoreLinks: PSP_LINKS,
  },

  // Alias for prospect form (field.key = "psps_needed")
  psps_needed: {
    tooltip: "The payment companies who will handle deposits and withdrawals from your players.",
    learnMore:
      "A PSP (Payment Service Provider) is the bridge between your platform and your players' banks or mobile money accounts. The PSP determines what currencies you accept, withdrawal speeds, transaction fees, and which local payment methods (M-Pesa, cards, USSD) are available. Trivelta has direct integrations with leading African PSPs including Paystack, Opay, PalmPay, and Aeropay, plus global providers like Worldpay and NMI. Your selected PSPs will be prioritized during platform setup.",
    learnMoreLinks: PSP_LINKS,
  },

  duns_number: {
    tooltip: "A unique 9-digit business ID issued by Dun and Bradstreet, used to verify your company with payment providers.",
    learnMore:
      "DUNS (Data Universal Numbering System) is a globally recognized business identifier - essentially a business version of a Social Security Number. Major payment providers, banks, and regulators request it to confirm your company exists and to link financial records. DUNS numbers are free to obtain at dnb.com and typically issued within 30 days. If you don't have one yet, some payment integrations can proceed in parallel while your DUNS application is in progress. Trivelta will flag this during setup.",
    learnMoreLinks: [
      { label: "Request a free DUNS number", url: "https://www.dnb.com/duns/get-a-duns.html" },
    ],
  },

  zendesk_account: {
    tooltip: "Your customer support helpdesk software where player tickets are managed.",
    learnMore:
      "Zendesk is an industry-standard customer service platform that centralizes player support - tickets, live chat, knowledge base, and escalation workflows. When connected to your Trivelta platform, support agents see player context automatically (account ID, deposit history, active bets) so they don't have to ask players to repeat information. Having an operational support channel before launch is non-negotiable for regulated iGaming - regulators audit response times during license renewals.",
  },

  sms_provider: {
    tooltip: "The service that sends SMS messages to your players for verification codes, deposit confirmations, and marketing.",
    learnMore:
      "Every regulated iGaming platform needs a reliable SMS gateway for account verification OTPs, transactional notifications, and bulk marketing campaigns. Infobip is a tier-one global SMS provider with strong delivery rates across Africa, Europe, and LATAM. Cost is typically per-message and varies by destination country (roughly $0.01-0.05 per SMS). Failed OTP delivery is a top cause of player sign-up drop-off, so reliability matters more than price.",
  },

  seon_fraud: {
    tooltip: "Fraud detection that scores each user based on email, phone, IP, and device signals.",
    learnMore:
      "SEON is a fraud prevention platform purpose-built for high-risk industries including iGaming. It runs silently on sign-up and deposit events, checking signals like whether the email is from a disposable provider, whether the IP geolocation matches the claimed country, whether the device has been linked to fraud before, whether the phone number has been recycled. Each user gets a risk score - high scores can be auto-blocked or routed to manual review. For iGaming this is essential defense against bonus abuse and multi-accounting, which are persistent threats in the industry.",
    learnMoreLinks: [
      { label: "SEON platform overview", url: "https://seon.io" },
    ],
  },

  kyc_surt_integration: {
    tooltip: "A premium identity verification platform specializing in fast, high-accuracy KYC for regulated industries.",
    learnMore:
      "Surt is a modern KYC provider built for regulated financial services and iGaming. It handles document verification, biometric face-matching, liveness detection, and continuous monitoring - all accessible through a single API. Surt performs especially well with documents from emerging markets (African IDs, LATAM nacional IDs, Asian passports) where legacy providers sometimes struggle with accuracy. The verification flow is optimized for mobile-first users - a player can complete full KYC in under 90 seconds on a smartphone. Trivelta works directly with Surt and can configure their platform specifically for your target markets and risk tolerance.",
    learnMoreLinks: [
      { label: "Contact Surt directly", url: "mailto:contact@surt.com" },
    ],
  },

  plaid_banking: {
    tooltip: "A platform that securely connects your platform to players' bank accounts for instant verification and deposits.",
    learnMore:
      "Plaid is the leading banking data platform in the US and increasingly in Europe - it lets players link their bank accounts securely without sharing raw credentials. For iGaming, Plaid can be used for instant ACH deposits (no waiting for transfers to clear), account ownership verification (confirm the player owns the payment method), and balance checks before allowing deposits. Plaid coverage is strongest in the US, UK, Canada, and parts of Europe - less comprehensive in Africa where direct PSP integrations handle these use cases.",
  },

  braze_crm: {
    tooltip: "The tool that sends personalized emails, push notifications, and in-app messages to players.",
    learnMore:
      "Braze is an enterprise-grade customer engagement platform - it decides who gets which message, when, and through which channel. Typical iGaming use cases: push notification to players who haven't deposited in 7 days, email high-rollers a VIP bonus, SMS anyone who abandoned a deposit flow, in-app message welcoming back returning players. Smart retention messaging is one of the highest-ROI investments for an operator - Braze lets your marketing team run sophisticated campaigns without engineering support. Trivelta includes Braze integration by default.",
  },

  sportradar_feed: {
    tooltip: "The data feed that provides live scores, odds, and statistics for your sports betting product.",
    learnMore:
      "If you offer sports betting, you need a live data feed providing current match scores, in-play odds calculations, fixture schedules, and detailed stats (corners, cards, possession). Sportradar is one of the two dominant global sports data providers, covering 600+ sports and all major leagues with sub-second latency. Pricing is based on sports coverage and live match volume - costs scale with your betting product scope. Trivelta integrates Sportradar as a standard feed option. Genius Sports is also available if you have a preference or existing relationship.",
    learnMoreLinks: [
      { label: "Sportradar", url: "https://www.sportradar.com" },
      { label: "Genius Sports", url: "https://geniussports.com" },
    ],
  },

  vertex_tax: {
    tooltip: "Automated tax calculation for player winnings across jurisdictions.",
    learnMore:
      "iGaming operators face complex tax obligations - player winnings may be taxable at the point of withdrawal, VAT applies to certain games in EU markets, and cross-border players add further complexity. Vertex automates the tax calculation at the transaction level: when a player withdraws, Vertex determines the correct tax based on player residence, jurisdiction, game type, and amount. This prevents under-withholding (fines from tax authorities) and over-withholding (angry players). Trivelta integrates Vertex for operators handling multiple jurisdictions.",
  },

  advertising_pixels: {
    tooltip: "Tracking codes from ad platforms (Facebook, Google, TikTok) that measure which ads bring paying players.",
    learnMore:
      "When you run paid acquisition campaigns, you need to know which ads actually convert into depositing players. Advertising pixels (also known as tracking codes) are JavaScript snippets from ad platforms that fire when a user signs up, makes a first deposit, or hits any conversion event. Without pixels you can't optimize ad spend - you're guessing. Trivelta installs pixels for Facebook, Google, TikTok, Twitter, and affiliate networks during setup. You provide the pixel IDs (found in your respective ad account dashboards) and your campaigns start attributing conversions immediately.",
  },
};
