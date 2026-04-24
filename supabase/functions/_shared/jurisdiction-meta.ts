/**
 * Jurisdiction metadata for legal content generation.
 * Keyed by the full label string (matching licenseJurisdiction values sent in GenerationRequest).
 * Duplicated from src/lib/jurisdictions.ts — edge functions cannot import from src/.
 */

export interface JurisdictionMeta {
  legalAge: number;
  dataLaw?: string;
  regulator?: string;
  language?: string;
}

const JURISDICTION_META_BY_LABEL: Record<string, JurisdictionMeta> = {
  // Africa
  "Nigeria (Federal Republic of Nigeria)": {
    legalAge: 18,
    dataLaw: "Nigeria Data Protection Act 2023 (NDPA)",
    regulator: "NLRC / State Gaming Boards",
    language: "en",
  },
  "South Africa (Western Cape Gambling Board)": {
    legalAge: 18,
    dataLaw: "POPIA (Protection of Personal Information Act)",
    regulator: "WCGRB",
    language: "en",
  },
  "South Africa (other provincial board)": {
    legalAge: 18,
    dataLaw: "POPIA (Protection of Personal Information Act)",
    regulator: "Provincial Gambling Board",
    language: "en",
  },
  "Kenya (Betting Control & Licensing Board)": {
    legalAge: 18,
    dataLaw: "Kenya Data Protection Act 2019",
    regulator: "BCLB",
    language: "en",
  },
  "Ghana (Gaming Commission of Ghana)": {
    legalAge: 18,
    dataLaw: "Ghana Data Protection Act 2012",
    regulator: "Gaming Commission of Ghana",
    language: "en",
  },
  "Tanzania (Gaming Board of Tanzania)": {
    legalAge: 18,
    dataLaw: "Tanzania Personal Data Protection Act 2022",
    regulator: "Gaming Board of Tanzania",
    language: "en",
  },
  "Uganda (National Lotteries & Gaming Regulatory Board)": {
    legalAge: 25,
    dataLaw: "Uganda Data Protection and Privacy Act 2019",
    regulator: "NLGRB",
    language: "en",
  },
  "Angola": { legalAge: 18, dataLaw: "Angola Data Protection Law (Law 22/11)", language: "pt" },
  "Mozambique": { legalAge: 18, dataLaw: "Mozambique Data Protection Law", language: "pt" },
  "Zimbabwe": { legalAge: 18, dataLaw: "Zimbabwe Data Protection Act 2021", language: "en" },
  "Zambia": { legalAge: 18, dataLaw: "Zambia Data Protection Act 2021", language: "en" },
  "Namibia": { legalAge: 18, dataLaw: "Namibia Data Protection Bill (pending)", language: "en" },
  "Rwanda": { legalAge: 18, dataLaw: "Rwanda Law on Personal Data Protection 2021", language: "en" },
  "Ethiopia": { legalAge: 18, dataLaw: "Ethiopia Personal Data Protection Proclamation", language: "en" },
  "Senegal": { legalAge: 18, dataLaw: "Senegal Data Protection Law 2008", language: "fr" },
  "Côte d'Ivoire": { legalAge: 18, dataLaw: "Côte d'Ivoire Data Protection Law 2013", language: "fr" },
  "Cameroon": { legalAge: 18, dataLaw: "Cameroon Data Protection Law", language: "fr" },
  "Democratic Republic of Congo": { legalAge: 18, dataLaw: "DRC Telecoms & ICT Law", language: "fr" },
  "Botswana": { legalAge: 18, dataLaw: "Botswana Data Protection Act 2018", language: "en" },
  "Egypt": { legalAge: 18, dataLaw: "Egypt Personal Data Protection Law 2020", language: "ar" },
  "Morocco": { legalAge: 18, dataLaw: "Morocco Data Protection Law 09-08", language: "ar" },

  // LATAM
  "Mexico (SEGOB / DGJS)": {
    legalAge: 18,
    dataLaw: "LFPDPPP (Ley Federal de Protección de Datos Personales)",
    regulator: "SEGOB / DGJS",
    language: "es",
  },
  "Brazil (SPA — Sports Betting)": {
    legalAge: 18,
    dataLaw: "LGPD (Lei Geral de Proteção de Dados)",
    regulator: "SPA",
    language: "pt",
  },
  "Argentina (Provincial — BA, Córdoba, etc.)": {
    legalAge: 18,
    dataLaw: "Ley 25.326 Protección de Datos Personales",
    regulator: "Provincial Authorities",
    language: "es",
  },
  "Colombia (Coljuegos)": {
    legalAge: 18,
    dataLaw: "Ley 1581 de 2012 (Habeas Data)",
    regulator: "Coljuegos",
    language: "es",
  },
  "Peru (MINCETUR)": {
    legalAge: 18,
    dataLaw: "Ley 29733 Protección de Datos Personales",
    regulator: "MINCETUR",
    language: "es",
  },
  "Chile": { legalAge: 18, dataLaw: "Ley 19.628 Protección de Datos", language: "es" },
  "Dominican Republic": { legalAge: 18, dataLaw: "Ley 172-13 Protección de Datos", language: "es" },
  "Panama (JCJ)": { legalAge: 18, dataLaw: "Ley 81 de Protección de Datos", regulator: "JCJ", language: "es" },
  "Ecuador": { legalAge: 18, dataLaw: "Ley Orgánica de Protección de Datos Personales", language: "es" },
  "Uruguay": { legalAge: 18, dataLaw: "Ley 18.331 Protección de Datos Personales", language: "es" },
  "Bolivia": { legalAge: 18, dataLaw: "Bolivia Data Protection (pending regulation)", language: "es" },
  "Paraguay": { legalAge: 18, dataLaw: "Ley 6534 Protección de Datos Personales", language: "es" },
  "Costa Rica": { legalAge: 18, dataLaw: "Ley 8968 Protección de Datos Personales", language: "es" },

  // International / Offshore
  "Curaçao (CGCB)": { legalAge: 18, dataLaw: "Curaçao Data Protection Ordinance", regulator: "CGCB", language: "en" },
  "Malta (MGA)": { legalAge: 18, dataLaw: "GDPR + Data Protection Act Malta", regulator: "MGA", language: "en" },
  "Anjouan": { legalAge: 18, dataLaw: "applicable local law", language: "en" },
  "Isle of Man": { legalAge: 18, dataLaw: "Isle of Man Data Protection Act 2018", language: "en" },
  "Gibraltar": { legalAge: 18, dataLaw: "Gibraltar GDPR + Data Protection Act", language: "en" },
  "Kahnawake (Canada)": { legalAge: 18, dataLaw: "Canadian PIPEDA + provincial laws", language: "en" },
};

export function getJurisdictionMeta(licenseJurisdiction: string): JurisdictionMeta {
  return JURISDICTION_META_BY_LABEL[licenseJurisdiction] ?? { legalAge: 18, language: "en" };
}
