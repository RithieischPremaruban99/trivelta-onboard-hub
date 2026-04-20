export type Language = 'en' | 'fr' | 'pt' | 'sw' | 'yo' | 'ha' | 'ar';

export interface TCMStrings {
  // ── Navigation ──────────────────────────────────────────────────────────
  FEED: string;
  SPORTSBOOK: string;
  DISCOVERY: string;
  CASINO: string;
  PEER_TO_PEER_NAV: string;
  HOME: string;
  PROFILE: string;
  // ── Quick access tiles ───────────────────────────────────────────────────
  TILE_LIVE_SPORTS: string;
  TILE_LOAD_CODE: string;
  TILE_VIRTUALS: string;
  TILE_PEER_TO_PEER: string;
  TILE_GAMERS_PARADISE: string;
  MOBILE_TILE_ALL_SPORTS: string;
  MOBILE_TILE_LIVE_SPO: string;
  MOBILE_TILE_LOAD_CO: string;
  MOBILE_TILE_GAMERS: string;
  // ── Buttons / actions ───────────────────────────────────────────────────
  BET_BUILDER: string;
  PEER_TO_PEER_BTN: string;
  SIGN_IN: string;
  CREATE_ACCOUNT: string;
  SEE_MORE: string;
  MORE_BETS: string;
  STATS: string;
  VIEW_TIPS: string;
  BACK_TO_SPORTS: string;
  SHARE: string;
  COLLAPSE: string;
  SHOW_ALL_LEGS: string;
  // ── Welcome bonus ─────────────────────────────────────────────────────────
  WELCOME_BONUS: string;
  WELCOME_BONUS_PROMO: string;
  WELCOME_BONUS_BODY_WEB: string;
  WELCOME_BONUS_BODY_MOBILE: string;
  // ── Section headings ──────────────────────────────────────────────────────
  LIVE_AND_UPCOMING: string;
  LIVE_AND_UPCOMING_GAMES: string;
  ALL_SPORTS: string;
  POPULAR: string;
  DISCOVER: string;
  CASINO_HEADING: string;
  // ── Search ────────────────────────────────────────────────────────────────
  SEARCH: string;
  SEARCH_PLACEHOLDER: string;
  // ── Tabs ──────────────────────────────────────────────────────────────────
  TAB_MY_BETS: string;
  TAB_MY_FEED: string;
  TAB_FRIENDS: string;
  TAB_EXPLORE: string;
  TAB_SPORTS: string;
  TAB_ALL_SPORTS: string;
  // ── Filters ───────────────────────────────────────────────────────────────
  FILTER_ALL: string;
  FILTER_PENDING: string;
  FILTER_SETTLED: string;
  FILTER_P2P: string;
  // ── Bet statuses ──────────────────────────────────────────────────────────
  STATUS_WON: string;
  STATUS_LOST: string;
  STATUS_PENDING: string;
  STATUS_LIVE: string;
  // ── Bet labels ────────────────────────────────────────────────────────────
  STAKE: string;
  PAYOUT: string;
  POTENTIAL: string;
  OUTCOME: string;
  ODDS_LABEL: string;
  FLEX_CUTS: string;
  // ── Misc ──────────────────────────────────────────────────────────────────
  NO_P2P_BETS: string;
  COMING_SOON: string;
  LIVE_BADGE: string;
}

export const DEFAULT_STRINGS: TCMStrings = {
  FEED: 'Feed',
  SPORTSBOOK: 'Sports',
  DISCOVERY: 'Discovery',
  CASINO: 'Casino',
  PEER_TO_PEER_NAV: 'Peer-to-peer',
  HOME: 'home',
  PROFILE: 'Profile',
  TILE_LIVE_SPORTS: 'Live Sports',
  TILE_LOAD_CODE: 'Load Code',
  TILE_VIRTUALS: 'Virtuals',
  TILE_PEER_TO_PEER: 'Peer to Peer',
  TILE_GAMERS_PARADISE: 'Gamers Paradise',
  MOBILE_TILE_ALL_SPORTS: 'All Sports',
  MOBILE_TILE_LIVE_SPO: 'Live Spo.',
  MOBILE_TILE_LOAD_CO: 'Load Co.',
  MOBILE_TILE_GAMERS: 'Gamers...',
  BET_BUILDER: 'BetBuilder',
  PEER_TO_PEER_BTN: 'Peer-to-Peer',
  SIGN_IN: 'Sign in',
  CREATE_ACCOUNT: 'Create an account',
  SEE_MORE: 'SEE MORE',
  MORE_BETS: 'MORE BETS',
  STATS: 'STATS',
  VIEW_TIPS: 'View Tips',
  BACK_TO_SPORTS: 'Back to Sports',
  SHARE: 'Share',
  COLLAPSE: 'Collapse',
  SHOW_ALL_LEGS: 'Show all legs',
  WELCOME_BONUS: 'WELCOME BONUS',
  WELCOME_BONUS_PROMO: 'GET A 100% BONUS ON YOUR FIRST DEPOSIT',
  WELCOME_BONUS_BODY_WEB: 'Enjoy 100% welcome bonus on your first deposit and double your starting stake.',
  WELCOME_BONUS_BODY_MOBILE: 'Get a Free Sportsbook Pick or Enjoy 50% More Casino Cash For Casino Games',
  LIVE_AND_UPCOMING: 'Live & Upcoming',
  LIVE_AND_UPCOMING_GAMES: 'Live & Upcoming Games',
  ALL_SPORTS: 'All Sports',
  POPULAR: 'Popular',
  DISCOVER: 'Discover',
  CASINO_HEADING: 'Casino',
  SEARCH: 'Search',
  SEARCH_PLACEHOLDER: 'Search teams, players and events',
  TAB_MY_BETS: 'My Bets',
  TAB_MY_FEED: 'My Feed',
  TAB_FRIENDS: 'Friends',
  TAB_EXPLORE: 'Explore',
  TAB_SPORTS: 'Sports',
  TAB_ALL_SPORTS: 'All Sports',
  FILTER_ALL: 'All',
  FILTER_PENDING: 'Pending',
  FILTER_SETTLED: 'Settled',
  FILTER_P2P: 'P2P',
  STATUS_WON: 'WON',
  STATUS_LOST: 'LOST',
  STATUS_PENDING: 'PENDING',
  STATUS_LIVE: 'LIVE',
  STAKE: 'STAKE',
  PAYOUT: 'PAYOUT',
  POTENTIAL: 'POTENTIAL',
  OUTCOME: 'OUTCOME',
  ODDS_LABEL: 'ODDS',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'No P2P bets yet',
  COMING_SOON: 'Coming soon',
  LIVE_BADGE: 'LIVE',
};

const FR_STRINGS: Partial<TCMStrings> = {
  FEED: 'Fil',
  SPORTSBOOK: 'Sport',
  DISCOVERY: 'Découverte',
  PEER_TO_PEER_NAV: 'Pair-à-pair',
  HOME: 'accueil',
  PROFILE: 'Profil',
  TILE_LIVE_SPORTS: 'En direct',
  TILE_PEER_TO_PEER: 'Pair à pair',
  MOBILE_TILE_ALL_SPORTS: 'Tous sports',
  MOBILE_TILE_LIVE_SPO: 'Direct.',
  BET_BUILDER: 'Créat. Pari',
  PEER_TO_PEER_BTN: 'Pair-à-pair',
  SIGN_IN: 'Se connecter',
  CREATE_ACCOUNT: 'Créer un compte',
  SEE_MORE: 'VOIR PLUS',
  MORE_BETS: 'PLUS DE PARIS',
  VIEW_TIPS: 'Voir les conseils',
  BACK_TO_SPORTS: 'Retour aux sports',
  SHARE: 'Partager',
  COLLAPSE: 'Réduire',
  SHOW_ALL_LEGS: 'Voir tous les paris',
  WELCOME_BONUS: 'BONUS DE BIENVENUE',
  WELCOME_BONUS_PROMO: 'OBTENEZ UN BONUS DE 100% SUR VOTRE PREMIER DÉPÔT',
  WELCOME_BONUS_BODY_WEB: "Profitez d'un bonus de bienvenue de 100% sur votre premier dépôt.",
  WELCOME_BONUS_BODY_MOBILE: 'Obtenez un pari gratuit ou 50% de crédit casino supplémentaire',
  LIVE_AND_UPCOMING: 'En direct & À venir',
  LIVE_AND_UPCOMING_GAMES: 'Matchs en direct & À venir',
  ALL_SPORTS: 'Tous les sports',
  POPULAR: 'Populaire',
  DISCOVER: 'Découvrir',
  CASINO_HEADING: 'Casino',
  SEARCH: 'Rechercher',
  SEARCH_PLACEHOLDER: 'Rechercher équipes, joueurs et événements',
  TAB_MY_BETS: 'Mes paris',
  TAB_MY_FEED: 'Mon fil',
  TAB_FRIENDS: 'Amis',
  TAB_EXPLORE: 'Explorer',
  TAB_SPORTS: 'Sports',
  TAB_ALL_SPORTS: 'Tous les sports',
  FILTER_ALL: 'Tous',
  FILTER_PENDING: 'En attente',
  FILTER_SETTLED: 'Réglé',
  STATUS_WON: 'GAGNÉ',
  STATUS_LOST: 'PERDU',
  STATUS_PENDING: 'EN ATTENTE',
  STATUS_LIVE: 'EN DIRECT',
  STAKE: 'MISE',
  PAYOUT: 'GAIN',
  POTENTIAL: 'POTENTIEL',
  OUTCOME: 'RÉSULTAT',
  ODDS_LABEL: 'COTES',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'Aucun pari P2P',
  COMING_SOON: 'Bientôt disponible',
  LIVE_BADGE: 'EN DIRECT',
};

const PT_STRINGS: Partial<TCMStrings> = {
  FEED: 'Feed',
  SPORTSBOOK: 'Desportos',
  DISCOVERY: 'Descoberta',
  PEER_TO_PEER_NAV: 'Par-a-par',
  HOME: 'início',
  PROFILE: 'Perfil',
  TILE_LIVE_SPORTS: 'Ao vivo',
  TILE_PEER_TO_PEER: 'Par a Par',
  MOBILE_TILE_ALL_SPORTS: 'Tod. Desp.',
  BET_BUILDER: 'Criar Aposta',
  PEER_TO_PEER_BTN: 'Par-a-par',
  SIGN_IN: 'Entrar',
  CREATE_ACCOUNT: 'Criar conta',
  SEE_MORE: 'VER MAIS',
  MORE_BETS: 'MAIS APOSTAS',
  VIEW_TIPS: 'Ver dicas',
  BACK_TO_SPORTS: 'Voltar a Desportos',
  SHARE: 'Partilhar',
  COLLAPSE: 'Fechar',
  SHOW_ALL_LEGS: 'Ver todas as apostas',
  WELCOME_BONUS: 'BÓNUS DE BOAS-VINDAS',
  WELCOME_BONUS_PROMO: 'OBTENHA 100% DE BÓNUS NO SEU PRIMEIRO DEPÓSITO',
  WELCOME_BONUS_BODY_WEB: 'Desfrute de 100% de bónus de boas-vindas no seu primeiro depósito.',
  WELCOME_BONUS_BODY_MOBILE: 'Obtenha uma aposta gratuita ou 50% mais créditos de cassino',
  LIVE_AND_UPCOMING: 'Ao vivo e próximos',
  LIVE_AND_UPCOMING_GAMES: 'Jogos ao vivo e próximos',
  ALL_SPORTS: 'Todos os desportos',
  POPULAR: 'Popular',
  DISCOVER: 'Descobrir',
  CASINO_HEADING: 'Cassino',
  SEARCH: 'Pesquisar',
  SEARCH_PLACEHOLDER: 'Pesquisar equipas, jogadores e eventos',
  TAB_MY_BETS: 'Minhas apostas',
  TAB_MY_FEED: 'Meu feed',
  TAB_FRIENDS: 'Amigos',
  TAB_EXPLORE: 'Explorar',
  TAB_SPORTS: 'Desportos',
  TAB_ALL_SPORTS: 'Todos os desportos',
  FILTER_ALL: 'Todos',
  FILTER_PENDING: 'Pendente',
  FILTER_SETTLED: 'Liquidado',
  STATUS_WON: 'GANHOU',
  STATUS_LOST: 'PERDEU',
  STATUS_PENDING: 'PENDENTE',
  STATUS_LIVE: 'AO VIVO',
  STAKE: 'APOSTA',
  PAYOUT: 'PAGAMENTO',
  POTENTIAL: 'POTENCIAL',
  OUTCOME: 'RESULTADO',
  ODDS_LABEL: 'ODDS',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'Sem apostas P2P',
  COMING_SOON: 'Em breve',
  LIVE_BADGE: 'AO VIVO',
};

const SW_STRINGS: Partial<TCMStrings> = {
  FEED: 'Mpasho',
  SPORTSBOOK: 'Michezo',
  DISCOVERY: 'Ugunduzi',
  PEER_TO_PEER_NAV: 'Mtu kwa Mtu',
  HOME: 'nyumbani',
  PROFILE: 'Wasifu',
  TILE_LIVE_SPORTS: 'Moja kwa Moja',
  TILE_PEER_TO_PEER: 'Mtu kwa Mtu',
  MOBILE_TILE_ALL_SPORTS: 'Mchezo wote',
  BET_BUILDER: 'Jenga Dau',
  PEER_TO_PEER_BTN: 'Mtu kwa Mtu',
  SIGN_IN: 'Ingia',
  CREATE_ACCOUNT: 'Fungua akaunti',
  SEE_MORE: 'TAZAMA ZAIDI',
  MORE_BETS: 'DAU ZAIDI',
  VIEW_TIPS: 'Tazama vidokezo',
  BACK_TO_SPORTS: 'Rudi kwa Michezo',
  SHARE: 'Shiriki',
  COLLAPSE: 'Funga',
  SHOW_ALL_LEGS: 'Onyesha dau zote',
  WELCOME_BONUS: 'BONASI YA KARIBU',
  WELCOME_BONUS_PROMO: 'PATA BONASI YA 100% KWENYE AMANA YAKO YA KWANZA',
  WELCOME_BONUS_BODY_WEB: 'Furahia bonasi ya 100% ya karibu kwenye amana yako ya kwanza.',
  WELCOME_BONUS_BODY_MOBILE: 'Pata mchezo wa dau bila malipo au 50% zaidi ya fedha za kasino',
  LIVE_AND_UPCOMING: 'Moja kwa Moja na Zijazo',
  LIVE_AND_UPCOMING_GAMES: 'Michezo ya Moja kwa Moja na Zijazo',
  ALL_SPORTS: 'Michezo Yote',
  POPULAR: 'Maarufu',
  DISCOVER: 'Gundua',
  CASINO_HEADING: 'Kasino',
  SEARCH: 'Tafuta',
  SEARCH_PLACEHOLDER: 'Tafuta timu, wachezaji na matukio',
  TAB_MY_BETS: 'Dau Zangu',
  TAB_MY_FEED: 'Mpasho Wangu',
  TAB_FRIENDS: 'Marafiki',
  TAB_EXPLORE: 'Chunguza',
  TAB_SPORTS: 'Michezo',
  TAB_ALL_SPORTS: 'Michezo Yote',
  FILTER_ALL: 'Yote',
  FILTER_PENDING: 'Inasubiri',
  FILTER_SETTLED: 'Kulipwa',
  STATUS_WON: 'UMESHINDA',
  STATUS_LOST: 'UMEPOTEZA',
  STATUS_PENDING: 'INASUBIRI',
  STATUS_LIVE: 'MOJA KWA MOJA',
  STAKE: 'KIASI',
  PAYOUT: 'MALIPO',
  POTENTIAL: 'UWEZEKANO',
  OUTCOME: 'MATOKEO',
  ODDS_LABEL: 'UWEZEKANO',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'Hakuna dau za P2P',
  COMING_SOON: 'Inakuja hivi karibuni',
  LIVE_BADGE: 'MOJA KWA MOJA',
};

const YO_STRINGS: Partial<TCMStrings> = {
  FEED: 'Agbeko',
  SPORTSBOOK: 'Ere-idaraya',
  DISCOVERY: 'Iwari',
  PEER_TO_PEER_NAV: 'Eniyan-si-Eniyan',
  HOME: 'ile',
  PROFILE: 'Profaili',
  BET_BUILDER: 'Kọ Tẹtẹ',
  PEER_TO_PEER_BTN: 'Eniyan-si-Eniyan',
  SIGN_IN: 'Wọle',
  CREATE_ACCOUNT: 'Ṣẹda àkọọlẹ',
  VIEW_TIPS: 'Wo Àwọn Imọ',
  BACK_TO_SPORTS: 'Padà sí Ere',
  SHARE: 'Pin',
  COLLAPSE: 'Tì',
  SHOW_ALL_LEGS: 'Ṣafihan gbogbo àwọn tẹtẹ',
  WELCOME_BONUS: 'ẸBỌ KAABỌ',
  WELCOME_BONUS_PROMO: 'GBA ẸBỌ 100% LORI IDOGO RẸ ÀKỌKỌ',
  WELCOME_BONUS_BODY_WEB: 'Gbadun ẹbọ kaabọ 100% lori idogo rẹ àkọkọ.',
  WELCOME_BONUS_BODY_MOBILE: 'Gba ere tẹtẹ ọfẹ tabi 50% siwaju sii ti owo kasino',
  LIVE_AND_UPCOMING: 'Laaye ati Awọn Tó Ń Bọ̀',
  LIVE_AND_UPCOMING_GAMES: 'Awọn Ere Laaye ati Awọn Tó Ń Bọ̀',
  ALL_SPORTS: 'Gbogbo Ere',
  POPULAR: 'Gbajúmọ̀',
  DISCOVER: 'Ṣàwárí',
  CASINO_HEADING: 'Kasino',
  SEARCH: 'Wá',
  SEARCH_PLACEHOLDER: 'Wá àwọn ẹgbẹ, àwọn ẹrọ-ìdárayá àti àwọn ìṣẹ̀lẹ̀',
  TAB_MY_BETS: 'Tẹtẹ Mi',
  TAB_MY_FEED: 'Agbeko Mi',
  TAB_FRIENDS: 'Àwọn Ọrẹ',
  TAB_EXPLORE: 'Ṣàwárí',
  TAB_SPORTS: 'Ere-idaraya',
  TAB_ALL_SPORTS: 'Gbogbo Ere',
  FILTER_ALL: 'Gbogbo',
  FILTER_PENDING: 'Tí ń Dúró',
  FILTER_SETTLED: 'Ti Pari',
  STATUS_WON: 'BORI',
  STATUS_LOST: 'PADANU',
  STATUS_PENDING: 'NÍ ÌDÁWỌLÉ',
  STATUS_LIVE: 'LAAYE',
  STAKE: 'ÌDOKOWÒ',
  PAYOUT: 'SISANWÓ',
  POTENTIAL: 'ṢEÉṢE',
  OUTCOME: 'ÈSÌ',
  ODDS_LABEL: 'ÀṢÀ',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'Ko si tẹtẹ P2P',
  COMING_SOON: 'Ń bọ laipẹ',
  LIVE_BADGE: 'LAAYE',
};

const HA_STRINGS: Partial<TCMStrings> = {
  FEED: 'Labarai',
  SPORTSBOOK: 'Wasanni',
  DISCOVERY: 'Gano',
  PEER_TO_PEER_NAV: 'Mutum-da-Mutum',
  HOME: 'gida',
  PROFILE: 'Bayani',
  BET_BUILDER: 'Gina Caca',
  PEER_TO_PEER_BTN: 'Mutum-da-Mutum',
  SIGN_IN: 'Shiga',
  CREATE_ACCOUNT: 'Ƙirƙiri asusun',
  VIEW_TIPS: 'Duba Shawarwari',
  BACK_TO_SPORTS: 'Koma ga Wasanni',
  SHARE: 'Raba',
  COLLAPSE: 'Rufe',
  SHOW_ALL_LEGS: 'Nuna duk cacaƙan',
  WELCOME_BONUS: 'KYAUTA NA MARABA',
  WELCOME_BONUS_PROMO: 'SAMU KYAUTA 100% A ADANKU NA FARKO',
  WELCOME_BONUS_BODY_WEB: 'Ji daɗin kyauta ta maraba ta 100% a adanku na farko.',
  WELCOME_BONUS_BODY_MOBILE: 'Samu kyautan wasannin ko 50% ƙari na kuɗin kasino',
  LIVE_AND_UPCOMING: 'Kai tsaye da Masu Zuwa',
  LIVE_AND_UPCOMING_GAMES: 'Wasannin Kai tsaye da Masu Zuwa',
  ALL_SPORTS: 'Duk Wasanni',
  POPULAR: 'Shahararru',
  DISCOVER: 'Gano',
  CASINO_HEADING: 'Kasino',
  SEARCH: 'Bincika',
  SEARCH_PLACEHOLDER: "Binciki ƙungiyoyi, 'yan wasa da abubuwan da suka faru",
  TAB_MY_BETS: 'Cacaƙana',
  TAB_MY_FEED: 'Labarina',
  TAB_FRIENDS: 'Abokai',
  TAB_EXPLORE: 'Binciko',
  TAB_SPORTS: 'Wasanni',
  TAB_ALL_SPORTS: 'Duk Wasanni',
  FILTER_ALL: 'Duka',
  FILTER_PENDING: 'Ana Jira',
  FILTER_SETTLED: 'An Biya',
  STATUS_WON: 'YA CI',
  STATUS_LOST: 'YA KASA',
  STATUS_PENDING: 'ANA JIRA',
  STATUS_LIVE: 'KAI TSAYE',
  STAKE: 'KUƊADE',
  PAYOUT: 'BIYAN KUƊI',
  POTENTIAL: 'IYAWA',
  OUTCOME: 'SAKAMAKON',
  ODDS_LABEL: 'DAMAR',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'Babu cacaƙin P2P',
  COMING_SOON: 'Zuwa ba da daɗewa ba',
  LIVE_BADGE: 'KAI TSAYE',
};

const AR_STRINGS: Partial<TCMStrings> = {
  FEED: 'الخلاصة',
  SPORTSBOOK: 'الرياضة',
  DISCOVERY: 'الاكتشاف',
  PEER_TO_PEER_NAV: 'نظير لنظير',
  HOME: 'الرئيسية',
  PROFILE: 'الملف الشخصي',
  BET_BUILDER: 'منشئ الرهانات',
  PEER_TO_PEER_BTN: 'نظير لنظير',
  SIGN_IN: 'تسجيل الدخول',
  CREATE_ACCOUNT: 'إنشاء حساب',
  SEE_MORE: 'عرض المزيد',
  MORE_BETS: 'مزيد من الرهانات',
  VIEW_TIPS: 'عرض النصائح',
  BACK_TO_SPORTS: 'العودة إلى الرياضات',
  SHARE: 'مشاركة',
  COLLAPSE: 'طي',
  SHOW_ALL_LEGS: 'عرض جميع الأرجل',
  WELCOME_BONUS: 'مكافأة الترحيب',
  WELCOME_BONUS_PROMO: 'احصل على مكافأة 100% على إيداعك الأول',
  WELCOME_BONUS_BODY_WEB: 'استمتع بمكافأة ترحيب 100% على إيداعك الأول وضاعف رهانك.',
  WELCOME_BONUS_BODY_MOBILE: 'احصل على رهان رياضي مجاني أو 50% إضافية من رصيد الكازينو',
  LIVE_AND_UPCOMING: 'مباشر والقادمة',
  LIVE_AND_UPCOMING_GAMES: 'المباريات المباشرة والقادمة',
  ALL_SPORTS: 'جميع الرياضات',
  POPULAR: 'شائع',
  DISCOVER: 'اكتشف',
  CASINO_HEADING: 'كازينو',
  SEARCH: 'بحث',
  SEARCH_PLACEHOLDER: 'البحث عن فرق، لاعبين وأحداث',
  TAB_MY_BETS: 'رهاناتي',
  TAB_MY_FEED: 'موجزي',
  TAB_FRIENDS: 'الأصدقاء',
  TAB_EXPLORE: 'استكشاف',
  TAB_SPORTS: 'الرياضة',
  TAB_ALL_SPORTS: 'جميع الرياضات',
  FILTER_ALL: 'الكل',
  FILTER_PENDING: 'قيد الانتظار',
  FILTER_SETTLED: 'مستوفى',
  STATUS_WON: 'فاز',
  STATUS_LOST: 'خسر',
  STATUS_PENDING: 'قيد الانتظار',
  STATUS_LIVE: 'مباشر',
  STAKE: 'الرهان',
  PAYOUT: 'المكاسب',
  POTENTIAL: 'المحتمل',
  OUTCOME: 'النتيجة',
  ODDS_LABEL: 'الحظوظ',
  FLEX_CUTS: 'FLEX CUTS',
  NO_P2P_BETS: 'لا رهانات P2P',
  COMING_SOON: 'قريباً',
  LIVE_BADGE: 'مباشر',
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  sw: 'Kiswahili',
  yo: 'Yorùbá',
  ha: 'Hausa',
  ar: 'العربية',
};

export const LANGUAGE_TRANSLATIONS: Record<Language, Partial<TCMStrings>> = {
  en: {},
  fr: FR_STRINGS,
  pt: PT_STRINGS,
  sw: SW_STRINGS,
  yo: YO_STRINGS,
  ha: HA_STRINGS,
  ar: AR_STRINGS,
};

export function getStrings(language: Language = 'en', overrides?: Partial<TCMStrings>): TCMStrings {
  const base: TCMStrings =
    language === 'en'
      ? DEFAULT_STRINGS
      : { ...DEFAULT_STRINGS, ...LANGUAGE_TRANSLATIONS[language] };
  return overrides ? { ...base, ...overrides } : base;
}
