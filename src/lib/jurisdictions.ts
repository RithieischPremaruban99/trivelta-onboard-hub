export interface Jurisdiction {
  value: string;
  label: string;
  region: "africa" | "latam" | "other";
  regulator?: string;
}

export const JURISDICTIONS: Jurisdiction[] = [
  // ── Africa ──────────────────────────────────────────────────────────────────
  { value: "nigeria", label: "Nigeria (Federal Republic of Nigeria)", region: "africa", regulator: "NLRC / State Boards" },
  { value: "south_africa_wc", label: "South Africa (Western Cape Gambling Board)", region: "africa", regulator: "WCGRB" },
  { value: "south_africa_other", label: "South Africa (other provincial board)", region: "africa" },
  { value: "kenya", label: "Kenya (Betting Control & Licensing Board)", region: "africa", regulator: "BCLB" },
  { value: "ghana", label: "Ghana (Gaming Commission of Ghana)", region: "africa", regulator: "GCG" },
  { value: "tanzania", label: "Tanzania (Gaming Board of Tanzania)", region: "africa", regulator: "GBT" },
  { value: "uganda", label: "Uganda (National Lotteries & Gaming Regulatory Board)", region: "africa", regulator: "NLGRB (25+)" },
  { value: "angola", label: "Angola", region: "africa" },
  { value: "mozambique", label: "Mozambique", region: "africa" },
  { value: "zimbabwe", label: "Zimbabwe", region: "africa" },
  { value: "zambia", label: "Zambia", region: "africa" },
  { value: "namibia", label: "Namibia", region: "africa" },
  { value: "rwanda", label: "Rwanda", region: "africa" },
  { value: "ethiopia", label: "Ethiopia", region: "africa" },
  { value: "senegal", label: "Senegal", region: "africa" },
  { value: "ivory_coast", label: "Côte d'Ivoire", region: "africa" },
  { value: "cameroon", label: "Cameroon", region: "africa" },
  { value: "drc", label: "Democratic Republic of Congo", region: "africa" },
  { value: "botswana", label: "Botswana", region: "africa" },
  { value: "egypt", label: "Egypt", region: "africa" },
  { value: "morocco", label: "Morocco", region: "africa" },

  // ── LATAM ────────────────────────────────────────────────────────────────────
  { value: "mexico", label: "Mexico (SEGOB / DGJS)", region: "latam", regulator: "DGJS" },
  { value: "brazil", label: "Brazil (SPA — Sports Betting)", region: "latam", regulator: "SPA" },
  { value: "argentina", label: "Argentina (Provincial — BA, Córdoba, etc.)", region: "latam" },
  { value: "colombia", label: "Colombia (Coljuegos)", region: "latam", regulator: "Coljuegos" },
  { value: "peru", label: "Peru (MINCETUR)", region: "latam", regulator: "MINCETUR" },
  { value: "chile", label: "Chile", region: "latam" },
  { value: "dominican_republic", label: "Dominican Republic", region: "latam" },
  { value: "panama", label: "Panama (JCJ)", region: "latam", regulator: "JCJ" },
  { value: "ecuador", label: "Ecuador", region: "latam" },
  { value: "uruguay", label: "Uruguay", region: "latam" },
  { value: "bolivia", label: "Bolivia", region: "latam" },
  { value: "paraguay", label: "Paraguay", region: "latam" },
  { value: "costa_rica", label: "Costa Rica", region: "latam" },

  // ── International / Offshore ─────────────────────────────────────────────────
  { value: "curacao", label: "Curaçao (CGCB)", region: "other", regulator: "CGCB" },
  { value: "malta", label: "Malta (MGA)", region: "other", regulator: "MGA" },
  { value: "anjouan", label: "Anjouan", region: "other" },
  { value: "isle_of_man", label: "Isle of Man", region: "other" },
  { value: "gibraltar", label: "Gibraltar", region: "other" },
  { value: "kahnawake", label: "Kahnawake (Canada)", region: "other" },
  { value: "other", label: "Other (free text)", region: "other" },
];

export const JURISDICTIONS_BY_REGION = {
  africa: JURISDICTIONS.filter((j) => j.region === "africa"),
  latam: JURISDICTIONS.filter((j) => j.region === "latam"),
  other: JURISDICTIONS.filter((j) => j.region === "other"),
};

/** Map from jurisdiction label → RG helpline defaults (auto-populated in LPG) */
export const RG_HELPLINES: Record<string, string> = {
  "Nigeria (Federal Republic of Nigeria)":
    "GambleAlert Nigeria\ngamblealert.org.ng\n+234 705 889 0073",
  "South Africa (Western Cape Gambling Board)":
    "Responsible Gambling Foundation\nresponsiblegambling.org.za\n0800 006 008",
  "South Africa (other provincial board)":
    "Responsible Gambling Foundation\nresponsiblegambling.org.za\n0800 006 008",
  "Kenya (Betting Control & Licensing Board)": "Gamblers Anonymous Kenya\ngakenya.org",
  "Ghana (Gaming Commission of Ghana)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Tanzania (Gaming Board of Tanzania)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Uganda (National Lotteries & Gaming Regulatory Board)":
    "Gamblers Anonymous International\ngamblersanonymous.org",
  "Angola": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Mozambique": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Zimbabwe": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Zambia": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Namibia": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Rwanda": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Ethiopia": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Senegal": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Côte d'Ivoire": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Cameroon": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Democratic Republic of Congo": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Botswana": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Egypt": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Morocco": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Mexico (SEGOB / DGJS)":
    "Jugadores Anónimos México\njugadoresanonimos.org.mx",
  "Brazil (SPA — Sports Betting)":
    "Jogadores Anônimos Brasil\njogadoresanonimos.com.br",
  "Argentina (Provincial — BA, Córdoba, etc.)":
    "Jugadores Anónimos Argentina\njugadoresanonimos.org",
  "Colombia (Coljuegos)":
    "Coljuegos Juego Responsable\ncoljuegos.gov.co",
  "Peru (MINCETUR)": "Jugadores Anónimos Peru\ngamblersanonymous.org",
  "Chile": "Jugadores Anónimos Chile\ngamblersanonymous.org",
  "Dominican Republic": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Panama (JCJ)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Ecuador": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Uruguay": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Bolivia": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Paraguay": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Costa Rica": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Curaçao (CGCB)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Malta (MGA)":
    "GamCare\ngamcare.org.uk\n0808 802 0133\n\nGamblers Anonymous\ngamblersanonymous.org",
  "Anjouan": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Isle of Man": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Gibraltar": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Kahnawake (Canada)": "Gamblers Anonymous International\ngamblersanonymous.org",
  "Other (free text)": "Gamblers Anonymous International\ngamblersanonymous.org",
};

// ─── Jurisdiction metadata ─────────────────────────────────────────────────

export interface JurisdictionMeta {
  legalAge: number;
  dataLaw?: string;
  regulator?: string;
  language?: "en" | "pt" | "es" | "fr" | "ar";
}

/** Keyed by the short `value` string (e.g. "nigeria", "brazil"). */
export const JURISDICTION_META: Record<string, JurisdictionMeta> = {
  nigeria: { legalAge: 18, dataLaw: "Nigeria Data Protection Act 2023 (NDPA)", regulator: "NLRC / State Gaming Boards", language: "en" },
  south_africa_wc: { legalAge: 18, dataLaw: "POPIA (Protection of Personal Information Act)", regulator: "WCGRB", language: "en" },
  south_africa_other: { legalAge: 18, dataLaw: "POPIA (Protection of Personal Information Act)", regulator: "Provincial Gambling Board", language: "en" },
  kenya: { legalAge: 18, dataLaw: "Kenya Data Protection Act 2019", regulator: "BCLB", language: "en" },
  ghana: { legalAge: 18, dataLaw: "Ghana Data Protection Act 2012", regulator: "Gaming Commission of Ghana", language: "en" },
  tanzania: { legalAge: 18, dataLaw: "Tanzania Personal Data Protection Act 2022", regulator: "Gaming Board of Tanzania", language: "en" },
  uganda: { legalAge: 25, dataLaw: "Uganda Data Protection and Privacy Act 2019", regulator: "NLGRB", language: "en" },
  angola: { legalAge: 18, dataLaw: "Angola Data Protection Law (Law 22/11)", language: "pt" },
  mozambique: { legalAge: 18, dataLaw: "Mozambique Data Protection Law", language: "pt" },
  zimbabwe: { legalAge: 18, dataLaw: "Zimbabwe Data Protection Act 2021", language: "en" },
  zambia: { legalAge: 18, dataLaw: "Zambia Data Protection Act 2021", language: "en" },
  namibia: { legalAge: 18, dataLaw: "Namibia Data Protection Bill (pending)", language: "en" },
  rwanda: { legalAge: 18, dataLaw: "Rwanda Law on Personal Data Protection 2021", language: "en" },
  ethiopia: { legalAge: 18, dataLaw: "Ethiopia Personal Data Protection Proclamation", language: "en" },
  senegal: { legalAge: 18, dataLaw: "Senegal Data Protection Law 2008", language: "fr" },
  ivory_coast: { legalAge: 18, dataLaw: "Côte d'Ivoire Data Protection Law 2013", language: "fr" },
  cameroon: { legalAge: 18, dataLaw: "Cameroon Data Protection Law", language: "fr" },
  drc: { legalAge: 18, dataLaw: "DRC Telecoms & ICT Law", language: "fr" },
  botswana: { legalAge: 18, dataLaw: "Botswana Data Protection Act 2018", language: "en" },
  egypt: { legalAge: 18, dataLaw: "Egypt Personal Data Protection Law 2020", language: "ar" },
  morocco: { legalAge: 18, dataLaw: "Morocco Data Protection Law 09-08", language: "ar" },
  mexico: { legalAge: 18, dataLaw: "LFPDPPP (Ley Federal de Protección de Datos Personales)", regulator: "SEGOB / DGJS", language: "es" },
  brazil: { legalAge: 18, dataLaw: "LGPD (Lei Geral de Proteção de Dados)", regulator: "SPA", language: "pt" },
  argentina: { legalAge: 18, dataLaw: "Ley 25.326 Protección de Datos Personales", regulator: "Provincial Authorities", language: "es" },
  colombia: { legalAge: 18, dataLaw: "Ley 1581 de 2012 (Habeas Data)", regulator: "Coljuegos", language: "es" },
  peru: { legalAge: 18, dataLaw: "Ley 29733 Protección de Datos Personales", regulator: "MINCETUR", language: "es" },
  chile: { legalAge: 18, dataLaw: "Ley 19.628 Protección de Datos", language: "es" },
  dominican_republic: { legalAge: 18, dataLaw: "Ley 172-13 Protección de Datos", language: "es" },
  panama: { legalAge: 18, dataLaw: "Ley 81 de Protección de Datos", regulator: "JCJ", language: "es" },
  ecuador: { legalAge: 18, dataLaw: "Ley Orgánica de Protección de Datos Personales", language: "es" },
  uruguay: { legalAge: 18, dataLaw: "Ley 18.331 Protección de Datos Personales", language: "es" },
  bolivia: { legalAge: 18, dataLaw: "Bolivia Data Protection (pending regulation)", language: "es" },
  paraguay: { legalAge: 18, dataLaw: "Ley 6534 Protección de Datos Personales", language: "es" },
  costa_rica: { legalAge: 18, dataLaw: "Ley 8968 Protección de Datos Personales", language: "es" },
  curacao: { legalAge: 18, dataLaw: "Curaçao Data Protection Ordinance", regulator: "CGCB", language: "en" },
  malta: { legalAge: 18, dataLaw: "GDPR + Data Protection Act Malta", regulator: "MGA", language: "en" },
  anjouan: { legalAge: 18, dataLaw: "applicable local law", language: "en" },
  isle_of_man: { legalAge: 18, dataLaw: "Isle of Man Data Protection Act 2018", language: "en" },
  gibraltar: { legalAge: 18, dataLaw: "Gibraltar GDPR + Data Protection Act", language: "en" },
  kahnawake: { legalAge: 18, dataLaw: "Canadian PIPEDA + provincial laws", language: "en" },
};

/** Look up meta by short value key (e.g. "nigeria"). */
export function getJurisdictionMeta(jurisdictionValue: string): JurisdictionMeta {
  return JURISDICTION_META[jurisdictionValue] ?? { legalAge: 18, language: "en" };
}

/** Look up meta by full label string — matches what licenseJurisdiction contains. */
export function getJurisdictionMetaByLabel(label: string): JurisdictionMeta {
  const j = JURISDICTIONS.find((jur) => jur.label === label);
  return j ? (JURISDICTION_META[j.value] ?? { legalAge: 18, language: "en" }) : { legalAge: 18, language: "en" };
}
