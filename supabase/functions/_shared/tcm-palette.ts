/**
 * TCM Palette — Trivelta Color Model (SHARED MODULE — Deno/Edge Function copy)
 *
 * ⚠️  SYNC WARNING: This file is a verbatim copy of src/lib/tcm-palette.ts
 * for use inside Supabase Edge Functions (Deno runtime), which cannot import
 * from the frontend source tree. If you update src/lib/tcm-palette.ts you
 * MUST update this file to match. Keep both files identical except this header.
 *
 * Single source of truth for all configurable color fields in the platform.
 * Generated from the TCM color spec. Do NOT edit defaults manually — update
 * the spec and regenerate.
 *
 * Naming convention: spec "Primary Background Color" → primaryBackgroundColor
 * Gradients with N stops → fieldName1 … fieldNameN
 */

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface TCMPalette {
  // ── Brand Core ────────────────────────────────────────────────────────────
  primaryBackgroundColor: string;
  primary: string;
  secondary: string;
  /** Primary Button gradient start */
  primaryButton: string;
  /** Primary Button gradient end */
  primaryButtonGradient: string;
  /** Box Gradient Colors start */
  boxGradientColorStart: string;
  /** Box Gradient Colors end */
  boxGradientColorEnd: string;
  activeSecondaryGradientColor: string;

  // ── Text ──────────────────────────────────────────────────────────────────
  lightTextColor: string;
  textInputPlaceholderText: string;
  navbarLabel: string;
  textSecondaryColor: string;
  darkTextColor: string;
  primaryTextColor: string;
  chatMessageTextColor: string;

  // ── Backgrounds ───────────────────────────────────────────────────────────
  dark: string;
  darkContainerBackground: string;
  modalBackground: string;
  inputBackgroundColor: string;
  bgColor: string;
  notificationSectionBg: string;
  freeBetBackground: string;
  betcardHeaderBg: string;
  flexBetHeaderBg: string;
  flexBetFooterBg: string;
  layerBg1: string;
  layerBg2: string;
  popoverBorder: string;
  propCityBackground: string;

  // ── Buttons ───────────────────────────────────────────────────────────────
  inactiveButtonBg: string;
  inactiveButtonTextPrimary: string;
  inactiveButtonTextSecondary: string;
  darkInactiveButtonText: string;
  swipeableBtnBg: string;
  eventSectionSgpBgColor: string;
  slideButtonGrad1: string;
  slideButtonGrad2: string;
  purchasePrimaryCircleColor: string;
  inactiveButtonGradient1: string;
  inactiveButtonGradient2: string;
  inactiveBackgroundGradient1: string;
  inactiveBackgroundGradient2: string;

  // ── Headers & Gradients ───────────────────────────────────────────────────
  headerBorderGradient1: string;
  headerBorderGradient2: string;
  defaultBorderGradient1: string;
  defaultBorderGradient2: string;
  defaultBorderGradient3: string;
  defaultButtonBorderGrad1: string;
  defaultButtonBorderGrad2: string;
  marketDataBg1: string;
  marketDataBg2: string;

  // ── Status — Win ──────────────────────────────────────────────────────────
  wonColor: string;
  wonGradient1: string;
  wonGradient2: string;
  payoutWonColor: string;
  /** Preserved spec typo: "Gradiant" */
  wonGradiantP2p: string;
  slantingLinesWon: string;
  winStatusGradient1: string;
  winStatusGradient2: string;
  winStatusGradient3: string;
  winStatusBorderGradient1: string;
  winStatusBorderGradient2: string;
  winStatusBorderGradient3: string;
  winStatusP2pGradient1: string;
  winStatusP2pGradient2: string;
  successIconP2p: string;
  validGradient: string;
  successBlurLayer: string;
  successInputGrad1: string;
  successInputGrad2: string;
  cashoutSuccessBgGrad1: string;
  cashoutSuccessBgGrad2: string;
  profitLineColor: string;
  profitLineGradColor: string;
  passwordStrongColor: string;
  completeChallengeBtnShadow: string;
  completeChallengeBtnBorderGrad1: string;
  completeChallengeBtnBorderGrad2: string;
  completeChallengeBtnBorderGrad3: string;
  completeChallengeBtnBorderGrad4: string;
  monthlyChallengeGrad1: string;
  monthlyChallengeGrad2: string;
  purchaseSuccessBorder: string;
  purchaseSuccessCardBoxStyle1: string;
  purchaseSuccessCardBoxStyle2: string;
  accentGreenSecondary: string;
  oddsLiveButtonBorderGrad1: string;
  oddsLiveButtonBorderGrad2: string;
  liveIncreaseOddsButtonShadows1: string;
  liveIncreaseOddsButtonShadows2: string;
  liveIncreaseOddsButtonShadows3: string;
  liveEventIncreaseColorPalette1: string;
  liveEventIncreaseColorPalette2: string;
  actionIconBoxBg: string;
  betStatusWinGradient1: string;
  betStatusWinGradient2: string;
  betFeedWonGradient1: string;
  betFeedWonGradient2: string;
  wonBorderGradColors1: string;
  wonBorderGradColors2: string;

  // ── Status — Loss ─────────────────────────────────────────────────────────
  lostColor: string;
  lostStatusColor: string;
  lossAmountText: string;
  loseStatusGradient1: string;
  loseStatusGradient2: string;
  loseStatusGradient3: string;
  loseStatusBorderGradient1: string;
  loseStatusBorderGradient2: string;
  loseStatusBorderGradient3: string;
  loseStatusP2pGradient1: string;
  loseStatusP2pGradient2: string;
  lostBorderGrad1: string;
  lostBorderGrad2: string;
  errorBlurLayer: string;
  weakPassword: string;
  captionAndErrorTxt: string;
  slantingLinesLost: string;
  iconBorderShadow: string;
  commentSectionBorder: string;
  errorGradient1: string;
  errorGradient2: string;
  purchaseErrorCardShadow1: string;
  purchaseErrorCardShadow2: string;
  responseModalBgLayerGradEnd: string;
  referralCloseIconColor: string;
  liveEventDecreaseColorPalette1: string;
  liveEventDecreaseColorPalette2: string;
  liveEventDecreaseBorderColorPalette1: string;
  liveEventDecreaseBorderColorPalette2: string;
  liveEventDecreaseBorderColorPalette3: string;
  cancelBorderGradient1: string;
  cancelBorderGradient2: string;
  cancelBorderGradient3: string;
  iconBackgroundGrad1: string;
  iconBackgroundGrad2: string;
  betStatusLoseGradient1: string;
  betStatusLoseGradient2: string;
  reportModalGradient1: string;
  reportModalGradient2: string;
  pokerLiveChatCountBorderColor: string;
  pokerFoldButtonGradient1: string;
  pokerFoldButtonGradient2: string;
  pokerFoldButtonGradient3: string;
  pokerFoldButtonGradient4: string;
  pokerFoldButtonGradient5: string;

  // ── Borders & Dividers ────────────────────────────────────────────────────
  borderAndGradientBg: string;
  inactiveTabUnderline: string;
  scrollbarThumbBgColor: string;
  pamScrollbarThumbColor: string;
  pamScrollbarBg: string;
  sidebarDefaultBorderColor: string;
  marketSelectBorderGradColor1: string;
  marketSelectBorderGradColor2: string;
  chatHighlightBorder1: string;
  chatHighlightBorder2: string;
  chatHighlightBorder3: string;
  onboardingBorderDiagonal1: string;
  onboardingBorderDiagonal2: string;
  onboardingBorderDiagonal3: string;
  tabBorderActive1: string;
  tabBorderActive2: string;
  socialContentBorder1: string;
  socialContentBorder2: string;
  socialContentBorder3: string;
  dayPickerHeaderColor: string;
  disabledDayColor: string;
  commentPinnedBg: string;
  commonBlurBg: string;
  listGradColorPrimary: string;
  infoImageBgColor: string;
  handsPlayedContainerGradient: string;

  // ── Poker ─────────────────────────────────────────────────────────────────
  /** UNRESOLVED: in task spec but absent from TCM color spec */
  pokerCheckButtonColor: string;
  /** UNRESOLVED: in task spec but absent from TCM color spec */
  pokerCallButtonColor: string;
  /** UNRESOLVED: in task spec but absent from TCM color spec */
  pokerRaiseButtonColor: string;
  /** UNRESOLVED: in task spec but absent from TCM color spec */
  pokerTimerColor: string;
  /** UNRESOLVED: in task spec but absent from TCM color spec */
  pokerChatIconColor: string;
  pokerChipColor: string;
  pokerActionButtonShadow: string;
  pokerCreateButtonShadow: string;
  pokerInviteButtonShadow: string;
  pokerFreeBetShadow: string;
  pokerNotificationBgGradient1: string;
  pokerMicIconActiveGradient1: string;
  pokerMicIconActiveGradient2: string;
  pokerMicIconActiveGradient3: string;
  pokerMicIconActiveGradient4: string;
  pokerTableRowGradientColor1: string;
  pokerTableRowGradientColor2: string;
  pokerPlayerInactiveGradient1: string;
  pokerPlayerInactiveGradient2: string;
  pokerTurnWaitingGradient1: string;
  pokerTurnWaitingGradient2: string;
  pokerSuccessGradient1: string;
  pokerSuccessGradient2: string;
  pokerMetricContainerBorderColor: string;
  pokerDefaultUserIconColor: string;
  pokerHandTypeContainer: string;
  pokerActiveTurnGradientColor: string;
  pokerSelectBodyColor: string;
  pokerSelectCustomStyleBgColor: string;
  pokerTableStyleBgColor: string;
  pokerChatGradient1: string;
  pokerChatGradient2: string;
  playerCardIconContainerGradient1: string;
  playerCardIconContainerGradient2: string;
  playerWithSeatContainerGradient1: string;
  playerWithSeatContainerGradient2: string;
  playerWithSeatContainerGradient3: string;
  playerOutContainerGradient1: string;
  playerOutContainerGradient2: string;
  p2pBlurEffectGradColor: string;
  p2pSidebarGrad1: string;
  p2pSidebarGrad2: string;
  p2pChallengeBoxGrad1: string;
  p2pChallengeBoxGrad2: string;

  // ── Pikkem ────────────────────────────────────────────────────────────────
  pikkemPlayerPositionDefaultBg: string;
  pikkemPlayerCardDefaultGradientColor: string;
  pikkemPlayerPositionDefaultBg2: string;
  pikkemWonColor: string;
  pikkemLostColor: string;
  pikkemPendingColor: string;
  pikkemDividerDotColor: string;
  pikkemLeaderboardHeaderColor: string;
  pikkemTeamPositionBorderColor: string;
  pikkemSliderBgColor: string;
  pikkemDeleteIconBg: string;
  pikkemDeleteIconColor: string;
  pikkemSuccessBg: string;
  pikkemSuccessBorderColor: string;
  pikkemErrorBg: string;
  pikkemErrorBorderColor: string;

  // ── Gamepass ──────────────────────────────────────────────────────────────
  gamepassDividerGradEndColor: string;
  gamepassPremiumXpMarkerBgColorStart: string;
  gamepassPremiumXpMarkerBgColorEnd: string;
  gamepassPremiumXpMarkerBorderColor: string;
  gamepassActiveColor: string;
  gamepassProgressColor: string;
  gamepassSliderGradColor1: string;
  gamepassSliderGradColor2: string;
  gamepassSliderGradColor3: string;
  /** Corrected from spec typo "Preminum" */
  gamepassPremiumSliderGradColor1: string;
  gamepassPremiumSliderGradColor2: string;
  gamepassCompletedTaskBgGrad1: string;
  gamepassCompletedTaskBgGrad2: string;
  gamepassGoldGradient1: string;
  gamepassGoldGradient2: string;
  gamepassGoldGradient3: string;
  gamepassGoldReverseGradient1: string;
  gamepassGoldReverseGradient2: string;
  gamepassDarkGradient1: string;
  gamepassDarkGradient2: string;
  gamepassSpinGradient1: string;
  gamepassSpinGradient2: string;
  gamepassSpinGradient3: string;
  gameLeagueOrderGradient1: string;
  /** NOTE: spec value is rgb() without alpha: "rgb(250, 191, 127)" */
  gameLeagueOrderGradient2: string;
  gameLeagueOrderGradient3: string;
  leagueOrderBg: string;
  premiumGradStartColor: string;
  premiumGradEndColor: string;
  premiumBoxShadowLayer1: string;
  premiumBoxShadowLayer2: string;
  premiumBoxShadowLayer3: string;
  spinWheelShadow: string;
  spinButtonShadow: string;
  spinOverlayGradSecondary: string;
  spinGradColor1: string;
  spinGradColor2: string;
  gamePassThumbColor: string;
  gamePassThumbColor2: string;
  muiSliderMarkcolor: string;
  muiSliderMarkcolor2: string;
  gamePassProgressGradient1: string;
  gamePassProgressGradient2: string;
  gamePassProgressGradient3: string;
  ncaaAthleteCardGradient1: string;
  shadowCardBlurLayerGradEnd: string;
  animationCardBorderGrad1: string;
  animationCardBorderGrad2: string;
  animationCardBorderGrad3: string;
  animationCardBorderGrad4: string;
  animationCardBorderGrad5: string;
  messageBubbleGradient1: string;
  messageBubbleGradient2: string;

  // ── Casino ────────────────────────────────────────────────────────────────
  casinoCardLayerGradColor1: string;
  casinoCardLayerGradColor2: string;
  casinoCardLayerGradColor3: string;
  casinoGameBorderGrad1: string;
  casinoGameBorderGrad2: string;
  supportPopupGradientColor1: string;
  supportPopupGradientColor2: string;
  /** Preserved spec name: "roulett" (without trailing e) */
  roulettWheelShadow1: string;
  roulettWheelShadow2: string;

  // ── PAM Admin Panel ───────────────────────────────────────────────────────
  pamChartCanceledBg: string;
  pamChartExpiredBg: string;
  pamChartPendingReviewBg: string;
  pamChartVerifiedBg: string;
  pamChartActiveBg: string;
  pamChartFailedBg: string;
  pamChartNotVerifiedBg: string;
  pamChartPurchaseBg: string;
  pamChartWithdrawalsBg: string;
  pamChartRevenueBg: string;
  pamChartSportsradarBg: string;
  pamChartDstBg: string;
  pamChartAcceptedBg: string;
  pamChartRejectedBg: string;
  pamChartPrizeRedemptionsBg: string;

  // ── Push & Notifications ──────────────────────────────────────────────────
  pushBackgroundColor: string;
  pushBorderGradSecondaryColor: string;
  pushBetcardGradColors1: string;
  pushBetcardGradColors2: string;
  pushGradient1: string;
  pushGradient2: string;
  pushNotificationGradient1: string;
  pushNotificationGradient2: string;
  neutralButtonGradient1: string;
  neutralButtonGradient2: string;
  neutralButtonGradient3: string;
  betStatusNeutralGradient1: string;
  betStatusNeutralGradient2: string;

  // ── Sportsbook Specific ───────────────────────────────────────────────────
  sportbookProfileBgColor: string;
  sportsbookDarkContainerGradient1: string;
  sportsbookDarkContainerGradient2: string;
  sportsbookTransparentGradient1: string;
  sportsbookTransparentGradient2: string;
  blackSolidGradient1: string;
  blackSolidGradient2: string;

  // ── Onboarding & Promo ────────────────────────────────────────────────────
  onboardingTopBgGrad1: string;
  onboardingTopBgGrad2: string;
  purchaseBonusCardActiveBg: string;

  // ── Misc ──────────────────────────────────────────────────────────────────
  topLeftIconBg1: string;
  topLeftIconBg2: string;
  vsColor: string;
  earthyBrown: string;
  bronzeColor: string;
  unlockIconPrimaryColor: string;
  /** UNRESOLVED: in task spec but absent from TCM color spec */
  linearGradientColor: string;
  radioButtonFocusStyle: string;
  radioButtonCheckedStyle: string;
  activeMarketListGradBg: string;
  betpostCardBorderGradPrimary: string;
  cashCoinContainerBgGrad1: string;
  cashCoinContainerBgGrad2: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TCM_PALETTE: TCMPalette = {
  // ── Brand Core ────────────────────────────────────────────────────────────
  primaryBackgroundColor: "rgba(8, 8, 11, 1)",
  primary: "rgba(253, 111, 39, 1)",
  secondary: "rgba(252, 66, 51, 1)",
  primaryButton: "rgba(252, 66, 51, 1)",
  primaryButtonGradient: "rgba(252, 167, 50, 1)",
  boxGradientColorStart: "rgba(245, 131, 0, 1)",
  boxGradientColorEnd: "rgba(3, 249, 73, 1)",
  activeSecondaryGradientColor: "rgba(255, 221, 36, 1)",

  // ── Text ──────────────────────────────────────────────────────────────────
  lightTextColor: "rgba(255, 255, 255, 1)",
  textInputPlaceholderText: "rgba(146, 146, 158, 1)",
  navbarLabel: "rgba(219, 219, 221, 1)",
  textSecondaryColor: "rgba(161, 161, 169, 1)",
  darkTextColor: "rgba(54, 54, 54, 1)",
  primaryTextColor: "rgba(199, 85, 27, 1)",
  chatMessageTextColor: "rgba(245, 153, 97, 1)",

  // ── Backgrounds ───────────────────────────────────────────────────────────
  dark: "rgba(11, 11, 12, 1)",
  darkContainerBackground: "rgba(24, 24, 24, 1)",
  modalBackground: "rgba(20, 20, 27, 1)",
  inputBackgroundColor: "rgba(34, 34, 34, 1)",
  bgColor: "rgba(0, 0, 0, 1)",
  notificationSectionBg: "rgba(14, 14, 15, 1)",
  freeBetBackground: "rgba(40, 38, 48, 1)",
  betcardHeaderBg: "rgba(37, 37, 47, 1)",
  flexBetHeaderBg: "rgba(26, 26, 34, 1)",
  flexBetFooterBg: "rgba(54, 34, 29, 1)",
  layerBg1: "rgba(9, 9, 12, 0.17)",
  layerBg2: "rgba(252, 77, 52, 0.17)",
  popoverBorder: "rgba(20, 20, 27, 1)",
  propCityBackground: "rgba(34, 23, 16, 1)",

  // ── Buttons ───────────────────────────────────────────────────────────────
  inactiveButtonBg: "rgba(95, 41, 24, 1)",
  inactiveButtonTextPrimary: "rgba(184, 82, 30, 1)",
  inactiveButtonTextSecondary: "rgba(129, 60, 30, 1)",
  darkInactiveButtonText: "rgba(67, 67, 77, 1)",
  swipeableBtnBg: "rgba(64, 19, 38, 1)",
  eventSectionSgpBgColor: "rgba(12, 10, 10, 1)",
  slideButtonGrad1: "rgba(110, 61, 37, 1)",
  slideButtonGrad2: "rgba(2, 2, 2, 1)",
  purchasePrimaryCircleColor: "rgba(130, 37, 31, 1)",
  inactiveButtonGradient1: "rgba(67, 67, 77, 1)",
  inactiveButtonGradient2: "rgba(67, 67, 77, 1)",
  inactiveBackgroundGradient1: "rgba(95, 41, 24, 1)",
  inactiveBackgroundGradient2: "rgba(95, 41, 24, 1)",

  // ── Headers & Gradients ───────────────────────────────────────────────────
  headerBorderGradient1: "rgba(37, 37, 47, 1)",
  headerBorderGradient2: "rgba(20, 20, 27, 1)",
  defaultBorderGradient1: "rgba(47, 47, 57, 1)",
  defaultBorderGradient2: "rgba(94, 94, 106, 1)",
  defaultBorderGradient3: "rgba(47, 47, 57, 1)",
  defaultButtonBorderGrad1: "rgba(255, 255, 255, 0.08)",
  defaultButtonBorderGrad2: "rgba(255, 255, 255, 0.4)",
  marketDataBg1: "rgba(48, 48, 66, 0.48)",
  marketDataBg2: "rgba(221, 141, 101, 0.08)",

  // ── Status — Win ──────────────────────────────────────────────────────────
  wonColor: "rgba(73, 218, 108, 1)",
  wonGradient1: "rgba(62, 192, 130, 1)",
  wonGradient2: "rgba(7,158,9,0.41642594537815125)",
  payoutWonColor: "rgba(64, 198, 134, 1)",
  wonGradiantP2p: "rgba(26, 80, 62, 1)",
  slantingLinesWon: "rgba(7, 110, 73, 1)",
  winStatusGradient1: "rgba(25, 71, 56, 1)",
  winStatusGradient2: "rgba(62, 192, 130, 1)",
  winStatusGradient3: "rgba(25, 71, 56, 1)",
  winStatusBorderGradient1: "rgba(25, 71, 56, 0.2)",
  winStatusBorderGradient2: "rgba(62, 192, 130, 1)",
  winStatusBorderGradient3: "rgba(25, 71, 56, 0.2)",
  winStatusP2pGradient1: "rgba(22, 98, 49, 1)",
  winStatusP2pGradient2: "rgba(20, 20, 27, 0)",
  successIconP2p: "rgba(12, 159, 18, 1)",
  validGradient: "rgba(22, 78, 51, 1)",
  successBlurLayer: "rgba(31, 67, 49, 1)",
  successInputGrad1: "rgba(22, 78, 51, 1)",
  successInputGrad2: "rgba(64, 198, 134, 1)",
  cashoutSuccessBgGrad1: "rgba(7, 110, 73, 0.2)",
  cashoutSuccessBgGrad2: "rgba(16, 51, 45, 0.16)",
  profitLineColor: "rgba(16, 144, 103, 1)",
  profitLineGradColor: "rgba(97, 204, 149, 1)",
  passwordStrongColor: "rgba(32, 146, 98, 1)",
  completeChallengeBtnShadow: "rgba(2, 133, 85, 0.8)",
  completeChallengeBtnBorderGrad1: "rgba(6, 255, 136, 1)",
  completeChallengeBtnBorderGrad2: "rgba(0, 178, 59, 1)",
  completeChallengeBtnBorderGrad3: "rgba(26, 80, 62, 0)",
  completeChallengeBtnBorderGrad4: "rgba(26, 80, 62, 0.1)",
  monthlyChallengeGrad1: "rgba(7, 110, 73, 1)",
  monthlyChallengeGrad2: "rgba(64, 198, 134, 1)",
  purchaseSuccessBorder: "rgba(35, 168, 112, 1)",
  purchaseSuccessCardBoxStyle1: "rgba(64, 198, 134, 0.1)",
  purchaseSuccessCardBoxStyle2: "rgba(64, 198, 134, 0.4)",
  accentGreenSecondary: "rgba(100, 180, 100, 1)",
  oddsLiveButtonBorderGrad1: "rgba(36, 81, 51, 1)",
  oddsLiveButtonBorderGrad2: "rgba(219, 255, 231, 1)",
  liveIncreaseOddsButtonShadows1: "rgba(66, 193, 94, 0.32)",
  liveIncreaseOddsButtonShadows2: "rgba(66, 193, 94, 0.64)",
  liveIncreaseOddsButtonShadows3: "rgba(66, 193, 94, 0.239)",
  liveEventIncreaseColorPalette1: "rgba(36, 81, 51, 1)",
  liveEventIncreaseColorPalette2: "rgba(0, 0, 0, 1)",
  actionIconBoxBg: "rgba(16, 51, 45, 1)",
  betStatusWinGradient1: "rgba(62, 192, 130, 1)",
  betStatusWinGradient2: "rgba(62, 192, 130, 0)",
  betFeedWonGradient1: "rgba(62, 192, 130, 1)",
  betFeedWonGradient2: "rgba(0, 0, 0, 1)",
  wonBorderGradColors1: "rgba(22, 94, 48, 0.2)",
  wonBorderGradColors2: "rgba(73, 216, 107, 1)",

  // ── Status — Loss ─────────────────────────────────────────────────────────
  lostColor: "rgba(216, 73, 107, 1)",
  lostStatusColor: "rgba(218, 73, 108, 1)",
  lossAmountText: "rgba(239, 68, 68, 1)",
  loseStatusGradient1: "rgba(94, 22, 48, 1)",
  loseStatusGradient2: "rgba(216, 73, 107, 1)",
  loseStatusGradient3: "rgba(94, 22, 48, 1)",
  loseStatusBorderGradient1: "rgba(94, 22, 48, 0.2)",
  loseStatusBorderGradient2: "rgba(216, 73, 107, 1)",
  loseStatusBorderGradient3: "rgba(94, 22, 48, 0.2)",
  loseStatusP2pGradient1: "rgba(98, 22, 49, 1)",
  loseStatusP2pGradient2: "rgba(20, 20, 27, 0)",
  lostBorderGrad1: "rgba(94, 22, 48, 0.2)",
  lostBorderGrad2: "rgba(216, 73, 107, 1)",
  errorBlurLayer: "rgba(79, 20, 34, 1)",
  weakPassword: "rgba(187, 56, 88, 1)",
  captionAndErrorTxt: "rgba(255, 0, 0, 1)",
  slantingLinesLost: "rgba(128, 32, 55, 1)",
  iconBorderShadow: "rgba(218, 73, 108, 0.2)",
  commentSectionBorder: "rgba(154, 42, 69, 1)",
  errorGradient1: "rgba(128, 32, 55, 1)",
  errorGradient2: "rgba(218, 73, 108, 1)",
  purchaseErrorCardShadow1: "rgba(218, 73, 108, 0.1)",
  purchaseErrorCardShadow2: "rgba(218, 73, 108, 0.4)",
  responseModalBgLayerGradEnd: "rgba(252, 51, 51, 0.2)",
  referralCloseIconColor: "rgba(250, 39, 90, 1)",
  liveEventDecreaseColorPalette1: "rgba(86, 28, 41, 1)",
  liveEventDecreaseColorPalette2: "rgba(0, 0, 0, 1)",
  liveEventDecreaseBorderColorPalette1: "rgba(86, 28, 41, 1)",
  liveEventDecreaseBorderColorPalette2: "rgba(219, 255, 231, 1)",
  liveEventDecreaseBorderColorPalette3: "rgba(86, 28, 41, 1)",
  cancelBorderGradient1: "rgba(143, 29, 70, 0.5)",
  cancelBorderGradient2: "rgba(255, 111, 145, 1)",
  cancelBorderGradient3: "rgba(143, 29, 70, 0.5)",
  iconBackgroundGrad1: "rgba(255, 107, 143, 1)",
  iconBackgroundGrad2: "rgba(255, 107, 143, 1)",
  betStatusLoseGradient1: "rgba(218, 73, 108, 1)",
  betStatusLoseGradient2: "rgba(218, 73, 108, 0)",
  reportModalGradient1: "rgba(154, 42, 69, 1)",
  reportModalGradient2: "rgba(154, 42, 69, 1)",
  pokerLiveChatCountBorderColor: "rgba(185, 28, 28, 1)",
  pokerFoldButtonGradient1: "rgba(244, 64, 49, 1)",
  pokerFoldButtonGradient2: "rgba(255, 118, 59, 1)",
  pokerFoldButtonGradient3: "rgba(103, 24, 12, 0.2)",
  pokerFoldButtonGradient4: "rgba(255, 144, 106, 1)",
  pokerFoldButtonGradient5: "rgba(103, 24, 12, 0.0862745)",

  // ── Borders & Dividers ────────────────────────────────────────────────────
  borderAndGradientBg: "rgba(66, 32, 21, 0.878)",
  inactiveTabUnderline: "rgba(128, 128, 128, 1)",
  scrollbarThumbBgColor: "rgba(48, 48, 58, 1)",
  pamScrollbarThumbColor: "rgba(68, 68, 68, 1)",
  pamScrollbarBg: "rgba(37, 39, 41, 1)",
  sidebarDefaultBorderColor: "rgba(26, 26, 26, 1)",
  marketSelectBorderGradColor1: "rgba(219, 158, 104, 1)",
  marketSelectBorderGradColor2: "rgba(49, 43, 51, 1)",
  chatHighlightBorder1: "rgba(133, 63, 12, 0.2)",
  chatHighlightBorder2: "rgba(245, 153, 97, 1)",
  chatHighlightBorder3: "rgba(133, 63, 12, 0.2)",
  onboardingBorderDiagonal1: "rgba(44, 44, 52, 1)",
  onboardingBorderDiagonal2: "rgba(237, 103, 14, 0.45)",
  onboardingBorderDiagonal3: "rgba(100, 180, 100, 1)",
  tabBorderActive1: "rgba(252, 66, 51, 1)",
  tabBorderActive2: "rgba(255, 221, 36, 1)",
  socialContentBorder1: "rgba(128, 33, 25, 1)",
  socialContentBorder2: "rgba(255, 238, 146, 1)",
  socialContentBorder3: "rgba(128, 33, 25, 1)",
  dayPickerHeaderColor: "rgba(136, 136, 136, 1)",
  disabledDayColor: "rgba(85, 85, 85, 1)",
  commentPinnedBg: "rgba(66, 32, 21, 1)",
  commonBlurBg: "rgba(94, 94, 106, 1)",
  listGradColorPrimary: "rgba(82, 82, 97, 1)",
  infoImageBgColor: "rgba(243, 243, 243, 0.058)",
  handsPlayedContainerGradient: "rgba(62, 62, 74, 0.24)",

  // ── Poker ─────────────────────────────────────────────────────────────────
  pokerCheckButtonColor: "rgba(0, 0, 0, 1)",
  pokerCallButtonColor: "rgba(0, 0, 0, 1)",
  pokerRaiseButtonColor: "rgba(0, 0, 0, 1)",
  pokerTimerColor: "rgba(0, 0, 0, 1)",
  pokerChatIconColor: "rgba(0, 0, 0, 1)",
  pokerChipColor: "rgba(101, 12, 68, 1)",
  pokerActionButtonShadow: "rgba(0, 105, 25, 0.88)",
  pokerCreateButtonShadow: "rgba(104, 14, 0, 0.88)",
  pokerInviteButtonShadow: "rgba(161, 196, 171, 1)",
  pokerFreeBetShadow: "rgba(84, 140, 29, 1)",
  pokerNotificationBgGradient1: "rgba(66, 32, 21, 0.4)",
  pokerMicIconActiveGradient1: "rgba(3, 163, 59, 1)",
  pokerMicIconActiveGradient2: "rgba(10, 204, 124, 1)",
  pokerMicIconActiveGradient3: "rgba(0, 105, 30, 1)",
  pokerMicIconActiveGradient4: "rgba(120, 213, 126, 1)",
  pokerTableRowGradientColor1: "rgba(255, 238, 146, 0.4)",
  pokerTableRowGradientColor2: "rgba(255, 238, 146, 0)",
  pokerPlayerInactiveGradient1: "rgba(185, 185, 196, 1)",
  pokerPlayerInactiveGradient2: "rgba(18, 18, 27, 1)",
  pokerTurnWaitingGradient1: "rgba(102, 102, 102, 1)",
  pokerTurnWaitingGradient2: "rgba(153, 153, 153, 1)",
  pokerSuccessGradient1: "rgba(3, 163, 59, 1)",
  pokerSuccessGradient2: "rgba(10, 204, 124, 1)",
  pokerMetricContainerBorderColor: "rgba(42, 41, 40, 1)",
  pokerDefaultUserIconColor: "rgba(93,93,109,1)",
  pokerHandTypeContainer: "rgba(251, 255, 0, 1)",
  pokerActiveTurnGradientColor: "rgba(230, 255, 3, 1)",
  pokerSelectBodyColor: "rgba(204, 204, 204, 1)",
  pokerSelectCustomStyleBgColor: "rgba(28, 28, 30, 1)",
  pokerTableStyleBgColor: "rgba(11, 102, 35, 1)",
  pokerChatGradient1: "rgba(254, 142, 44, 1)",
  pokerChatGradient2: "rgba(252, 69, 51, 1)",
  playerCardIconContainerGradient1: "rgba(204, 204, 217, 0.25)",
  playerCardIconContainerGradient2: "rgba(200, 200, 211, 0.5)",
  playerWithSeatContainerGradient1: "rgba(20, 20, 27, 0.88)",
  playerWithSeatContainerGradient2: "rgba(18, 18, 24, 0.4)",
  playerWithSeatContainerGradient3: "rgba(185, 185, 196, 0.4)",
  playerOutContainerGradient1: "rgba(22, 21, 28, 1)",
  playerOutContainerGradient2: "rgba(18, 18, 24, 1)",
  p2pBlurEffectGradColor: "rgba(22, 22, 22, 1)",
  p2pSidebarGrad1: "rgba(10, 10, 13, 1)",
  p2pSidebarGrad2: "rgba(10, 10, 13, 0.01)",
  p2pChallengeBoxGrad1: "rgba(38, 38, 51, 1)",
  p2pChallengeBoxGrad2: "rgba(50, 50, 66, 1)",

  // ── Pikkem ────────────────────────────────────────────────────────────────
  pikkemPlayerPositionDefaultBg: "rgba(62, 132, 95, 1)",
  pikkemPlayerCardDefaultGradientColor: "rgba(62, 132, 95, 0)",
  pikkemPlayerPositionDefaultBg2: "rgba(81, 19, 160, 0)",
  pikkemWonColor: "rgba(63, 255, 95, 1)",
  pikkemLostColor: "rgba(204, 24, 60, 1)",
  pikkemPendingColor: "rgba(156, 163, 175, 1)",
  pikkemDividerDotColor: "rgba(117, 117, 130, 1)",
  pikkemLeaderboardHeaderColor: "rgba(255, 255, 255, 0.02)",
  pikkemTeamPositionBorderColor: "rgba(232, 162, 30, 1)",
  pikkemSliderBgColor: "rgba(67, 67, 80, 1)",
  pikkemDeleteIconBg: "rgba(77, 9, 23, 1)",
  pikkemDeleteIconColor: "rgba(255, 30, 75, 1)",
  pikkemSuccessBg: "rgba(6, 45, 13, 1)",
  pikkemSuccessBorderColor: "rgba(25, 115, 40, 1)",
  pikkemErrorBg: "rgba(51, 6, 15, 1)",
  pikkemErrorBorderColor: "rgba(113, 15, 35, 1)",

  // ── Gamepass ──────────────────────────────────────────────────────────────
  gamepassDividerGradEndColor: "rgba(90, 53, 34, 1)",
  gamepassPremiumXpMarkerBgColorStart: "rgba(241, 185, 94, 1)",
  gamepassPremiumXpMarkerBgColorEnd: "rgba(203, 118, 20, 1)",
  gamepassPremiumXpMarkerBorderColor: "rgba(190, 144, 28, 0.5)",
  gamepassActiveColor: "rgba(255, 238, 146, 1)",
  gamepassProgressColor: "rgba(252, 66, 51, 0.5)",
  gamepassSliderGradColor1: "rgba(52, 49, 57, 1)",
  gamepassSliderGradColor2: "rgba(52, 52, 65, 1)",
  gamepassSliderGradColor3: "rgba(37, 37, 47, 1)",
  gamepassPremiumSliderGradColor1: "rgba(249, 210, 103, 0.1)",
  gamepassPremiumSliderGradColor2: "rgba(179, 123, 47, 0.2)",
  gamepassCompletedTaskBgGrad1: "rgba(6, 255, 136, 1)",
  gamepassCompletedTaskBgGrad2: "rgba(21, 96, 68, 1)",
  gamepassGoldGradient1: "rgba(179, 123, 47, 1)",
  gamepassGoldGradient2: "rgba(249, 210, 103, 1)",
  gamepassGoldGradient3: "rgba(179, 123, 47, 1)",
  gamepassGoldReverseGradient1: "rgba(249, 210, 103, 1)",
  gamepassGoldReverseGradient2: "rgba(179, 123, 47, 1)",
  gamepassDarkGradient1: "rgba(11, 10, 12, 1)",
  gamepassDarkGradient2: "rgba(42, 23, 16, 1)",
  gamepassSpinGradient1: "rgba(20, 20, 27, 1)",
  gamepassSpinGradient2: "rgba(60, 129, 30, 1)",
  gamepassSpinGradient3: "rgba(199, 85, 27, 1)",
  gameLeagueOrderGradient1: "rgba(239, 175, 119, 1)",
  gameLeagueOrderGradient2: "rgb(250, 191, 127)",
  gameLeagueOrderGradient3: "rgba(197, 97, 75, 1)",
  leagueOrderBg: "rgba(31, 31, 40, 1)",
  premiumGradStartColor: "rgba(179, 123, 47, 0.5)",
  premiumGradEndColor: "rgba(255, 236, 182, 1)",
  premiumBoxShadowLayer1: "rgba(233, 190, 90, 0.1)",
  premiumBoxShadowLayer2: "rgba(179, 123, 47, 0.2)",
  premiumBoxShadowLayer3: "rgba(179, 123, 47, 0.4)",
  spinWheelShadow: "rgba(255, 140, 0, 1)",
  spinButtonShadow: "rgba(255, 140, 0, 0.5)",
  spinOverlayGradSecondary: "rgba(4, 2, 2, 0.2)",
  spinGradColor1: "rgba(34, 34, 34, 1)",
  spinGradColor2: "rgba(26, 26, 34, 1)",
  gamePassThumbColor: "rgba(6, 255, 136, 1)",
  gamePassThumbColor2: "rgba(0, 178, 59, 1)",
  muiSliderMarkcolor: "rgba(252, 157, 50, 1)",
  muiSliderMarkcolor2: "rgba(255, 95, 1, 0.2)",
  gamePassProgressGradient1: "rgba(255, 214, 0, 1)",
  gamePassProgressGradient2: "rgba(255, 145, 0, 1)",
  gamePassProgressGradient3: "rgba(255, 60, 0, 1)",
  ncaaAthleteCardGradient1: "rgba(252, 162, 51, 0.11)",
  shadowCardBlurLayerGradEnd: "rgba(255, 167, 85, 0.70)",
  animationCardBorderGrad1: "rgba(9, 9, 12, 1)",
  animationCardBorderGrad2: "rgba(255, 238, 146, 1)",
  animationCardBorderGrad3: "rgba(252, 66, 51, 1)",
  animationCardBorderGrad4: "rgba(235, 131, 122, 0.32)",
  animationCardBorderGrad5: "rgba(215, 205, 204, 0.12)",
  messageBubbleGradient1: "rgba(255, 167, 85, 1)",
  messageBubbleGradient2: "rgba(234, 91, 18, 1)",

  // ── Casino ────────────────────────────────────────────────────────────────
  casinoCardLayerGradColor1: "rgba(9, 9, 12, 0.56)",
  casinoCardLayerGradColor2: "rgba(9, 9, 12, 0.16)",
  casinoCardLayerGradColor3: "rgba(9, 9, 12, 0)",
  casinoGameBorderGrad1: "rgba(170, 57, 0, 0)",
  casinoGameBorderGrad2: "rgba(170, 57, 0, 1)",
  supportPopupGradientColor1: "rgba(252, 77, 52, 0.11)",
  supportPopupGradientColor2: "rgba(252, 162, 51, 0.11)",
  roulettWheelShadow1: "rgba(255, 127, 0, 0.20)",
  roulettWheelShadow2: "rgba(255, 127, 0, 0.10)",

  // ── PAM Admin Panel ───────────────────────────────────────────────────────
  pamChartCanceledBg: "rgba(35, 183, 229, 1)",
  pamChartExpiredBg: "rgba(255, 255, 255, 1)",
  pamChartPendingReviewBg: "rgba(245, 184, 73, 1)",
  pamChartVerifiedBg: "rgba(38, 191, 148, 1)",
  pamChartActiveBg: "rgba(110, 46, 245, 1)",
  pamChartFailedBg: "rgba(230, 83, 60, 1)",
  pamChartNotVerifiedBg: "rgba(253, 111, 15, 1)",
  pamChartPurchaseBg: "rgba(110, 46, 245, 1)",
  pamChartWithdrawalsBg: "rgba(230, 83, 60, 1)",
  pamChartRevenueBg: "rgba(38, 191, 148, 1)",
  pamChartSportsradarBg: "rgba(155, 89, 182, 1)",
  pamChartDstBg: "rgba(113, 191, 138, 1)",
  pamChartAcceptedBg: "rgba(38, 191, 148, 1)",
  pamChartRejectedBg: "rgba(230, 83, 60, 1)",
  pamChartPrizeRedemptionsBg: "rgba(230, 83, 60, 1)",

  // ── Push & Notifications ──────────────────────────────────────────────────
  pushBackgroundColor: "rgba(255, 190, 63, 1)",
  pushBorderGradSecondaryColor: "rgba(232, 215, 122, 0.2)",
  pushBetcardGradColors1: "rgba(255, 215, 0, 1)",
  pushBetcardGradColors2: "rgba(255, 235, 59, 0.42)",
  pushGradient1: "rgba(82, 82, 97, 1)",
  pushGradient2: "rgba(255, 190, 63, 0.3)",
  pushNotificationGradient1: "rgba(255, 190, 63, 0.3)",
  pushNotificationGradient2: "rgba(20, 20, 27, 1)",
  neutralButtonGradient1: "rgba(82, 82, 97, 1)",
  neutralButtonGradient2: "rgba(37, 37, 47, 1)",
  neutralButtonGradient3: "rgba(82, 82, 97, 1)",
  betStatusNeutralGradient1: "rgba(230, 230, 230, 1)",
  betStatusNeutralGradient2: "rgba(230, 230, 230, 0)",

  // ── Sportsbook Specific ───────────────────────────────────────────────────
  sportbookProfileBgColor: "rgba(0, 120, 212, 1)",
  sportsbookDarkContainerGradient1: "rgba(20, 20, 27, 1)",
  sportsbookDarkContainerGradient2: "rgba(20, 20, 27, 1)",
  sportsbookTransparentGradient1: "rgba(0, 0, 0, 0)",
  sportsbookTransparentGradient2: "rgba(0, 0, 0, 0)",
  blackSolidGradient1: "rgba(0, 0, 0, 1)",
  blackSolidGradient2: "rgba(0, 0, 0, 1)",

  // ── Onboarding & Promo ────────────────────────────────────────────────────
  onboardingTopBgGrad1: "rgba(252, 77, 52, 0.2)",
  onboardingTopBgGrad2: "rgba(252, 162, 51, 0.2)",
  purchaseBonusCardActiveBg: "rgba(43, 20, 13, 1)",

  // ── Misc ──────────────────────────────────────────────────────────────────
  topLeftIconBg1: "rgba(0, 0, 0, 1)",
  topLeftIconBg2: "rgba(0, 0, 0, 1)",
  vsColor: "rgba(73, 52, 40, 1)",
  earthyBrown: "rgba(85, 45, 24, 1)",
  bronzeColor: "rgba(133, 63, 12, 0.1)",
  unlockIconPrimaryColor: "rgba(1, 1, 3, 0.5)",
  linearGradientColor: "rgba(0, 0, 0, 1)",
  radioButtonFocusStyle: "rgba(19, 124, 189, 0.6)",
  radioButtonCheckedStyle: "rgba(19, 124, 189, 1)",
  activeMarketListGradBg: "rgba(54, 42, 42, 1)",
  betpostCardBorderGradPrimary: "rgba(252, 208, 51, 0.2)",
  cashCoinContainerBgGrad1: "rgba(32, 32, 32, 1)",
  cashCoinContainerBgGrad2: "rgba(21, 21, 21, 1)",
};

// ---------------------------------------------------------------------------
// Quick-edit fields (25) — shown in the collapsed panel picker
// ---------------------------------------------------------------------------

export const QUICK_EDIT_FIELDS: (keyof TCMPalette)[] = [
  "primaryBackgroundColor",
  "primary",
  "secondary",
  "primaryButton",
  "primaryButtonGradient",
  "lightTextColor",
  "textSecondaryColor",
  "darkTextColor",
  "navbarLabel",
  "wonColor",
  "lostColor",
  "payoutWonColor",
  "lossAmountText",
  "headerBorderGradient1",
  "headerBorderGradient2",
  "boxGradientColorStart",
  "boxGradientColorEnd",
  "dark",
  "darkContainerBackground",
  "modalBackground",
  "notificationSectionBg",
  "borderAndGradientBg",
  "inactiveButtonBg",
  "inactiveTabUnderline",
  "activeSecondaryGradientColor",
];

// ---------------------------------------------------------------------------
// Advanced field groups — shown in expanded accordion panels
// ---------------------------------------------------------------------------

export const ADVANCED_FIELD_GROUPS: Record<string, (keyof TCMPalette)[]> = {
  "Brand Core": [
    "primaryBackgroundColor",
    "primary",
    "secondary",
    "primaryButton",
    "primaryButtonGradient",
    "boxGradientColorStart",
    "boxGradientColorEnd",
    "activeSecondaryGradientColor",
  ],
  "Text": [
    "lightTextColor",
    "textInputPlaceholderText",
    "navbarLabel",
    "textSecondaryColor",
    "darkTextColor",
    "primaryTextColor",
    "chatMessageTextColor",
  ],
  "Backgrounds": [
    "dark",
    "darkContainerBackground",
    "modalBackground",
    "inputBackgroundColor",
    "bgColor",
    "notificationSectionBg",
    "freeBetBackground",
    "betcardHeaderBg",
    "flexBetHeaderBg",
    "flexBetFooterBg",
    "layerBg1",
    "layerBg2",
    "popoverBorder",
    "propCityBackground",
  ],
  "Buttons": [
    "inactiveButtonBg",
    "inactiveButtonTextPrimary",
    "inactiveButtonTextSecondary",
    "darkInactiveButtonText",
    "swipeableBtnBg",
    "eventSectionSgpBgColor",
    "slideButtonGrad1",
    "slideButtonGrad2",
    "purchasePrimaryCircleColor",
    "inactiveButtonGradient1",
    "inactiveButtonGradient2",
    "inactiveBackgroundGradient1",
    "inactiveBackgroundGradient2",
  ],
  "Headers & Gradients": [
    "headerBorderGradient1",
    "headerBorderGradient2",
    "defaultBorderGradient1",
    "defaultBorderGradient2",
    "defaultBorderGradient3",
    "defaultButtonBorderGrad1",
    "defaultButtonBorderGrad2",
    "marketDataBg1",
    "marketDataBg2",
  ],
  "Status — Win": [
    "wonColor",
    "wonGradient1",
    "wonGradient2",
    "payoutWonColor",
    "wonGradiantP2p",
    "slantingLinesWon",
    "winStatusGradient1",
    "winStatusGradient2",
    "winStatusGradient3",
    "winStatusBorderGradient1",
    "winStatusBorderGradient2",
    "winStatusBorderGradient3",
    "winStatusP2pGradient1",
    "winStatusP2pGradient2",
    "successIconP2p",
    "validGradient",
    "successBlurLayer",
    "successInputGrad1",
    "successInputGrad2",
    "cashoutSuccessBgGrad1",
    "cashoutSuccessBgGrad2",
    "profitLineColor",
    "profitLineGradColor",
    "passwordStrongColor",
    "completeChallengeBtnShadow",
    "completeChallengeBtnBorderGrad1",
    "completeChallengeBtnBorderGrad2",
    "completeChallengeBtnBorderGrad3",
    "completeChallengeBtnBorderGrad4",
    "monthlyChallengeGrad1",
    "monthlyChallengeGrad2",
    "purchaseSuccessBorder",
    "purchaseSuccessCardBoxStyle1",
    "purchaseSuccessCardBoxStyle2",
    "accentGreenSecondary",
    "oddsLiveButtonBorderGrad1",
    "oddsLiveButtonBorderGrad2",
    "liveIncreaseOddsButtonShadows1",
    "liveIncreaseOddsButtonShadows2",
    "liveIncreaseOddsButtonShadows3",
    "liveEventIncreaseColorPalette1",
    "liveEventIncreaseColorPalette2",
    "actionIconBoxBg",
    "betStatusWinGradient1",
    "betStatusWinGradient2",
    "betFeedWonGradient1",
    "betFeedWonGradient2",
    "wonBorderGradColors1",
    "wonBorderGradColors2",
  ],
  "Status — Loss": [
    "lostColor",
    "lostStatusColor",
    "lossAmountText",
    "loseStatusGradient1",
    "loseStatusGradient2",
    "loseStatusGradient3",
    "loseStatusBorderGradient1",
    "loseStatusBorderGradient2",
    "loseStatusBorderGradient3",
    "loseStatusP2pGradient1",
    "loseStatusP2pGradient2",
    "lostBorderGrad1",
    "lostBorderGrad2",
    "errorBlurLayer",
    "weakPassword",
    "captionAndErrorTxt",
    "slantingLinesLost",
    "iconBorderShadow",
    "commentSectionBorder",
    "errorGradient1",
    "errorGradient2",
    "purchaseErrorCardShadow1",
    "purchaseErrorCardShadow2",
    "responseModalBgLayerGradEnd",
    "referralCloseIconColor",
    "liveEventDecreaseColorPalette1",
    "liveEventDecreaseColorPalette2",
    "liveEventDecreaseBorderColorPalette1",
    "liveEventDecreaseBorderColorPalette2",
    "liveEventDecreaseBorderColorPalette3",
    "cancelBorderGradient1",
    "cancelBorderGradient2",
    "cancelBorderGradient3",
    "iconBackgroundGrad1",
    "iconBackgroundGrad2",
    "betStatusLoseGradient1",
    "betStatusLoseGradient2",
    "reportModalGradient1",
    "reportModalGradient2",
    "pokerLiveChatCountBorderColor",
    "pokerFoldButtonGradient1",
    "pokerFoldButtonGradient2",
    "pokerFoldButtonGradient3",
    "pokerFoldButtonGradient4",
    "pokerFoldButtonGradient5",
  ],
  "Borders & Dividers": [
    "borderAndGradientBg",
    "inactiveTabUnderline",
    "scrollbarThumbBgColor",
    "pamScrollbarThumbColor",
    "pamScrollbarBg",
    "sidebarDefaultBorderColor",
    "marketSelectBorderGradColor1",
    "marketSelectBorderGradColor2",
    "chatHighlightBorder1",
    "chatHighlightBorder2",
    "chatHighlightBorder3",
    "onboardingBorderDiagonal1",
    "onboardingBorderDiagonal2",
    "onboardingBorderDiagonal3",
    "tabBorderActive1",
    "tabBorderActive2",
    "socialContentBorder1",
    "socialContentBorder2",
    "socialContentBorder3",
    "dayPickerHeaderColor",
    "disabledDayColor",
    "commentPinnedBg",
    "commonBlurBg",
    "listGradColorPrimary",
    "infoImageBgColor",
    "handsPlayedContainerGradient",
  ],
  "Poker": [
    "pokerCheckButtonColor",
    "pokerCallButtonColor",
    "pokerRaiseButtonColor",
    "pokerTimerColor",
    "pokerChatIconColor",
    "pokerChipColor",
    "pokerActionButtonShadow",
    "pokerCreateButtonShadow",
    "pokerInviteButtonShadow",
    "pokerFreeBetShadow",
    "pokerNotificationBgGradient1",
    "pokerMicIconActiveGradient1",
    "pokerMicIconActiveGradient2",
    "pokerMicIconActiveGradient3",
    "pokerMicIconActiveGradient4",
    "pokerTableRowGradientColor1",
    "pokerTableRowGradientColor2",
    "pokerPlayerInactiveGradient1",
    "pokerPlayerInactiveGradient2",
    "pokerTurnWaitingGradient1",
    "pokerTurnWaitingGradient2",
    "pokerSuccessGradient1",
    "pokerSuccessGradient2",
    "pokerMetricContainerBorderColor",
    "pokerDefaultUserIconColor",
    "pokerHandTypeContainer",
    "pokerActiveTurnGradientColor",
    "pokerSelectBodyColor",
    "pokerSelectCustomStyleBgColor",
    "pokerTableStyleBgColor",
    "pokerChatGradient1",
    "pokerChatGradient2",
    "playerCardIconContainerGradient1",
    "playerCardIconContainerGradient2",
    "playerWithSeatContainerGradient1",
    "playerWithSeatContainerGradient2",
    "playerWithSeatContainerGradient3",
    "playerOutContainerGradient1",
    "playerOutContainerGradient2",
    "p2pBlurEffectGradColor",
    "p2pSidebarGrad1",
    "p2pSidebarGrad2",
    "p2pChallengeBoxGrad1",
    "p2pChallengeBoxGrad2",
  ],
  "Pikkem": [
    "pikkemPlayerPositionDefaultBg",
    "pikkemPlayerCardDefaultGradientColor",
    "pikkemPlayerPositionDefaultBg2",
    "pikkemWonColor",
    "pikkemLostColor",
    "pikkemPendingColor",
    "pikkemDividerDotColor",
    "pikkemLeaderboardHeaderColor",
    "pikkemTeamPositionBorderColor",
    "pikkemSliderBgColor",
    "pikkemDeleteIconBg",
    "pikkemDeleteIconColor",
    "pikkemSuccessBg",
    "pikkemSuccessBorderColor",
    "pikkemErrorBg",
    "pikkemErrorBorderColor",
  ],
  "Gamepass": [
    "gamepassDividerGradEndColor",
    "gamepassPremiumXpMarkerBgColorStart",
    "gamepassPremiumXpMarkerBgColorEnd",
    "gamepassPremiumXpMarkerBorderColor",
    "gamepassActiveColor",
    "gamepassProgressColor",
    "gamepassSliderGradColor1",
    "gamepassSliderGradColor2",
    "gamepassSliderGradColor3",
    "gamepassPremiumSliderGradColor1",
    "gamepassPremiumSliderGradColor2",
    "gamepassCompletedTaskBgGrad1",
    "gamepassCompletedTaskBgGrad2",
    "gamepassGoldGradient1",
    "gamepassGoldGradient2",
    "gamepassGoldGradient3",
    "gamepassGoldReverseGradient1",
    "gamepassGoldReverseGradient2",
    "gamepassDarkGradient1",
    "gamepassDarkGradient2",
    "gamepassSpinGradient1",
    "gamepassSpinGradient2",
    "gamepassSpinGradient3",
    "gameLeagueOrderGradient1",
    "gameLeagueOrderGradient2",
    "gameLeagueOrderGradient3",
    "leagueOrderBg",
    "premiumGradStartColor",
    "premiumGradEndColor",
    "premiumBoxShadowLayer1",
    "premiumBoxShadowLayer2",
    "premiumBoxShadowLayer3",
    "spinWheelShadow",
    "spinButtonShadow",
    "spinOverlayGradSecondary",
    "spinGradColor1",
    "spinGradColor2",
    "gamePassThumbColor",
    "gamePassThumbColor2",
    "muiSliderMarkcolor",
    "muiSliderMarkcolor2",
    "gamePassProgressGradient1",
    "gamePassProgressGradient2",
    "gamePassProgressGradient3",
    "ncaaAthleteCardGradient1",
    "shadowCardBlurLayerGradEnd",
    "animationCardBorderGrad1",
    "animationCardBorderGrad2",
    "animationCardBorderGrad3",
    "animationCardBorderGrad4",
    "animationCardBorderGrad5",
    "messageBubbleGradient1",
    "messageBubbleGradient2",
  ],
  "Casino": [
    "casinoCardLayerGradColor1",
    "casinoCardLayerGradColor2",
    "casinoCardLayerGradColor3",
    "casinoGameBorderGrad1",
    "casinoGameBorderGrad2",
    "supportPopupGradientColor1",
    "supportPopupGradientColor2",
    "roulettWheelShadow1",
    "roulettWheelShadow2",
  ],
  "PAM Admin Panel": [
    "pamChartCanceledBg",
    "pamChartExpiredBg",
    "pamChartPendingReviewBg",
    "pamChartVerifiedBg",
    "pamChartActiveBg",
    "pamChartFailedBg",
    "pamChartNotVerifiedBg",
    "pamChartPurchaseBg",
    "pamChartWithdrawalsBg",
    "pamChartRevenueBg",
    "pamChartSportsradarBg",
    "pamChartDstBg",
    "pamChartAcceptedBg",
    "pamChartRejectedBg",
    "pamChartPrizeRedemptionsBg",
  ],
  "Push & Notifications": [
    "pushBackgroundColor",
    "pushBorderGradSecondaryColor",
    "pushBetcardGradColors1",
    "pushBetcardGradColors2",
    "pushGradient1",
    "pushGradient2",
    "pushNotificationGradient1",
    "pushNotificationGradient2",
    "neutralButtonGradient1",
    "neutralButtonGradient2",
    "neutralButtonGradient3",
    "betStatusNeutralGradient1",
    "betStatusNeutralGradient2",
  ],
  "Sportsbook Specific": [
    "sportbookProfileBgColor",
    "sportsbookDarkContainerGradient1",
    "sportsbookDarkContainerGradient2",
    "sportsbookTransparentGradient1",
    "sportsbookTransparentGradient2",
    "blackSolidGradient1",
    "blackSolidGradient2",
  ],
  "Onboarding & Promo": [
    "onboardingTopBgGrad1",
    "onboardingTopBgGrad2",
    "purchaseBonusCardActiveBg",
  ],
  "Misc": [
    "topLeftIconBg1",
    "topLeftIconBg2",
    "vsColor",
    "earthyBrown",
    "bronzeColor",
    "unlockIconPrimaryColor",
    "linearGradientColor",
    "radioButtonFocusStyle",
    "radioButtonCheckedStyle",
    "activeMarketListGradBg",
    "betpostCardBorderGradPrimary",
    "cashCoinContainerBgGrad1",
    "cashCoinContainerBgGrad2",
  ],
};

// ---------------------------------------------------------------------------
// Field labels — camelCase key → human-readable display name
// ---------------------------------------------------------------------------

export const FIELD_LABELS: Record<keyof TCMPalette, string> = {
  primaryBackgroundColor: "Primary Background",
  primary: "Primary",
  secondary: "Secondary",
  primaryButton: "Primary Button Start",
  primaryButtonGradient: "Primary Button End",
  boxGradientColorStart: "Box Gradient Start",
  boxGradientColorEnd: "Box Gradient End",
  activeSecondaryGradientColor: "Active Secondary Gradient",
  lightTextColor: "Light Text",
  textInputPlaceholderText: "Placeholder Text",
  navbarLabel: "Navbar Label",
  textSecondaryColor: "Text Secondary",
  darkTextColor: "Dark Text",
  primaryTextColor: "Primary Text",
  chatMessageTextColor: "Chat Message Text",
  dark: "Dark Surface",
  darkContainerBackground: "Dark Container Background",
  modalBackground: "Modal Background",
  inputBackgroundColor: "Input Background",
  bgColor: "Base Background",
  notificationSectionBg: "Notification Section BG",
  freeBetBackground: "Free Bet Background",
  betcardHeaderBg: "Bet Card Header BG",
  flexBetHeaderBg: "Flex Bet Header BG",
  flexBetFooterBg: "Flex Bet Footer BG",
  layerBg1: "Layer BG 1",
  layerBg2: "Layer BG 2",
  popoverBorder: "Popover Border",
  propCityBackground: "Prop City Background",
  inactiveButtonBg: "Inactive Button BG",
  inactiveButtonTextPrimary: "Inactive Button Text Primary",
  inactiveButtonTextSecondary: "Inactive Button Text Secondary",
  darkInactiveButtonText: "Dark Inactive Button Text",
  swipeableBtnBg: "Swipeable Button BG",
  eventSectionSgpBgColor: "SGP Button BG",
  slideButtonGrad1: "Slide Button Gradient 1",
  slideButtonGrad2: "Slide Button Gradient 2",
  purchasePrimaryCircleColor: "Purchase Circle Color",
  inactiveButtonGradient1: "Inactive Button Gradient 1",
  inactiveButtonGradient2: "Inactive Button Gradient 2",
  inactiveBackgroundGradient1: "Inactive Background Gradient 1",
  inactiveBackgroundGradient2: "Inactive Background Gradient 2",
  headerBorderGradient1: "Header Border Gradient 1",
  headerBorderGradient2: "Header Border Gradient 2",
  defaultBorderGradient1: "Default Border Gradient 1",
  defaultBorderGradient2: "Default Border Gradient 2",
  defaultBorderGradient3: "Default Border Gradient 3",
  defaultButtonBorderGrad1: "Default Button Border 1",
  defaultButtonBorderGrad2: "Default Button Border 2",
  marketDataBg1: "Market Data BG 1",
  marketDataBg2: "Market Data BG 2",
  wonColor: "Won Color",
  wonGradient1: "Won Gradient 1",
  wonGradient2: "Won Gradient 2",
  payoutWonColor: "Payout Won Color",
  wonGradiantP2p: "Won P2P Gradient",
  slantingLinesWon: "Slanting Lines Won",
  winStatusGradient1: "Win Status Gradient 1",
  winStatusGradient2: "Win Status Gradient 2",
  winStatusGradient3: "Win Status Gradient 3",
  winStatusBorderGradient1: "Win Status Border 1",
  winStatusBorderGradient2: "Win Status Border 2",
  winStatusBorderGradient3: "Win Status Border 3",
  winStatusP2pGradient1: "Win P2P Gradient 1",
  winStatusP2pGradient2: "Win P2P Gradient 2",
  successIconP2p: "Success Icon P2P",
  validGradient: "Valid Gradient",
  successBlurLayer: "Success Blur Layer",
  successInputGrad1: "Success Input Gradient 1",
  successInputGrad2: "Success Input Gradient 2",
  cashoutSuccessBgGrad1: "Cashout Success BG 1",
  cashoutSuccessBgGrad2: "Cashout Success BG 2",
  profitLineColor: "Profit Line Color",
  profitLineGradColor: "Profit Line Gradient",
  passwordStrongColor: "Strong Password Color",
  completeChallengeBtnShadow: "Complete Challenge Button Shadow",
  completeChallengeBtnBorderGrad1: "Challenge Button Border 1",
  completeChallengeBtnBorderGrad2: "Challenge Button Border 2",
  completeChallengeBtnBorderGrad3: "Challenge Button Border 3",
  completeChallengeBtnBorderGrad4: "Challenge Button Border 4",
  monthlyChallengeGrad1: "Monthly Challenge Gradient 1",
  monthlyChallengeGrad2: "Monthly Challenge Gradient 2",
  purchaseSuccessBorder: "Purchase Success Border",
  purchaseSuccessCardBoxStyle1: "Purchase Success Box 1",
  purchaseSuccessCardBoxStyle2: "Purchase Success Box 2",
  accentGreenSecondary: "Accent Green Secondary",
  oddsLiveButtonBorderGrad1: "Live Odds Button Border 1",
  oddsLiveButtonBorderGrad2: "Live Odds Button Border 2",
  liveIncreaseOddsButtonShadows1: "Live Increase Odds Shadow 1",
  liveIncreaseOddsButtonShadows2: "Live Increase Odds Shadow 2",
  liveIncreaseOddsButtonShadows3: "Live Increase Odds Shadow 3",
  liveEventIncreaseColorPalette1: "Live Event Increase Color 1",
  liveEventIncreaseColorPalette2: "Live Event Increase Color 2",
  actionIconBoxBg: "Action Icon Box BG",
  betStatusWinGradient1: "Bet Status Win Gradient 1",
  betStatusWinGradient2: "Bet Status Win Gradient 2",
  betFeedWonGradient1: "Bet Feed Won Gradient 1",
  betFeedWonGradient2: "Bet Feed Won Gradient 2",
  wonBorderGradColors1: "Won Border Gradient 1",
  wonBorderGradColors2: "Won Border Gradient 2",
  lostColor: "Lost Color",
  lostStatusColor: "Lost Status Color",
  lossAmountText: "Loss Amount Text",
  loseStatusGradient1: "Lose Status Gradient 1",
  loseStatusGradient2: "Lose Status Gradient 2",
  loseStatusGradient3: "Lose Status Gradient 3",
  loseStatusBorderGradient1: "Lose Status Border 1",
  loseStatusBorderGradient2: "Lose Status Border 2",
  loseStatusBorderGradient3: "Lose Status Border 3",
  loseStatusP2pGradient1: "Lose P2P Gradient 1",
  loseStatusP2pGradient2: "Lose P2P Gradient 2",
  lostBorderGrad1: "Lost Border Gradient 1",
  lostBorderGrad2: "Lost Border Gradient 2",
  errorBlurLayer: "Error Blur Layer",
  weakPassword: "Weak Password Color",
  captionAndErrorTxt: "Caption & Error Text",
  slantingLinesLost: "Slanting Lines Lost",
  iconBorderShadow: "Icon Border Shadow",
  commentSectionBorder: "Comment Section Border",
  errorGradient1: "Error Gradient 1",
  errorGradient2: "Error Gradient 2",
  purchaseErrorCardShadow1: "Purchase Error Shadow 1",
  purchaseErrorCardShadow2: "Purchase Error Shadow 2",
  responseModalBgLayerGradEnd: "Response Modal BG End",
  referralCloseIconColor: "Referral Close Icon",
  liveEventDecreaseColorPalette1: "Live Event Decrease Color 1",
  liveEventDecreaseColorPalette2: "Live Event Decrease Color 2",
  liveEventDecreaseBorderColorPalette1: "Live Decrease Border 1",
  liveEventDecreaseBorderColorPalette2: "Live Decrease Border 2",
  liveEventDecreaseBorderColorPalette3: "Live Decrease Border 3",
  cancelBorderGradient1: "Cancel Border 1",
  cancelBorderGradient2: "Cancel Border 2",
  cancelBorderGradient3: "Cancel Border 3",
  iconBackgroundGrad1: "Icon Background Gradient 1",
  iconBackgroundGrad2: "Icon Background Gradient 2",
  betStatusLoseGradient1: "Bet Status Lose Gradient 1",
  betStatusLoseGradient2: "Bet Status Lose Gradient 2",
  reportModalGradient1: "Report Modal Gradient 1",
  reportModalGradient2: "Report Modal Gradient 2",
  pokerLiveChatCountBorderColor: "Poker Live Chat Count Border",
  pokerFoldButtonGradient1: "Poker Fold Button 1",
  pokerFoldButtonGradient2: "Poker Fold Button 2",
  pokerFoldButtonGradient3: "Poker Fold Button 3",
  pokerFoldButtonGradient4: "Poker Fold Button 4",
  pokerFoldButtonGradient5: "Poker Fold Button 5",
  borderAndGradientBg: "Border & Gradient BG",
  inactiveTabUnderline: "Inactive Tab Underline",
  scrollbarThumbBgColor: "Scrollbar Thumb",
  pamScrollbarThumbColor: "PAM Scrollbar Thumb",
  pamScrollbarBg: "PAM Scrollbar BG",
  sidebarDefaultBorderColor: "Sidebar Default Border",
  marketSelectBorderGradColor1: "Market Select Border 1",
  marketSelectBorderGradColor2: "Market Select Border 2",
  chatHighlightBorder1: "Chat Highlight Border 1",
  chatHighlightBorder2: "Chat Highlight Border 2",
  chatHighlightBorder3: "Chat Highlight Border 3",
  onboardingBorderDiagonal1: "Onboarding Diagonal Border 1",
  onboardingBorderDiagonal2: "Onboarding Diagonal Border 2",
  onboardingBorderDiagonal3: "Onboarding Diagonal Border 3",
  tabBorderActive1: "Active Tab Border 1",
  tabBorderActive2: "Active Tab Border 2",
  socialContentBorder1: "Social Content Border 1",
  socialContentBorder2: "Social Content Border 2",
  socialContentBorder3: "Social Content Border 3",
  dayPickerHeaderColor: "Day Picker Header",
  disabledDayColor: "Disabled Day Color",
  commentPinnedBg: "Comment Pinned BG",
  commonBlurBg: "Common Blur BG",
  listGradColorPrimary: "List Gradient Primary",
  infoImageBgColor: "Info Image BG",
  handsPlayedContainerGradient: "Hands Played Container",
  pokerCheckButtonColor: "Poker Check Button",
  pokerCallButtonColor: "Poker Call Button",
  pokerRaiseButtonColor: "Poker Raise Button",
  pokerTimerColor: "Poker Timer",
  pokerChatIconColor: "Poker Chat Icon",
  pokerChipColor: "Poker Chip Color",
  pokerActionButtonShadow: "Poker Action Button Shadow",
  pokerCreateButtonShadow: "Poker Create Button Shadow",
  pokerInviteButtonShadow: "Poker Invite Button Shadow",
  pokerFreeBetShadow: "Poker Free Bet Shadow",
  pokerNotificationBgGradient1: "Poker Notification BG",
  pokerMicIconActiveGradient1: "Poker Mic Active 1",
  pokerMicIconActiveGradient2: "Poker Mic Active 2",
  pokerMicIconActiveGradient3: "Poker Mic Active 3",
  pokerMicIconActiveGradient4: "Poker Mic Active 4",
  pokerTableRowGradientColor1: "Poker Table Row 1",
  pokerTableRowGradientColor2: "Poker Table Row 2",
  pokerPlayerInactiveGradient1: "Poker Player Inactive 1",
  pokerPlayerInactiveGradient2: "Poker Player Inactive 2",
  pokerTurnWaitingGradient1: "Poker Turn Waiting 1",
  pokerTurnWaitingGradient2: "Poker Turn Waiting 2",
  pokerSuccessGradient1: "Poker Success Gradient 1",
  pokerSuccessGradient2: "Poker Success Gradient 2",
  pokerMetricContainerBorderColor: "Poker Metric Border",
  pokerDefaultUserIconColor: "Poker Default User Icon",
  pokerHandTypeContainer: "Poker Hand Type Container",
  pokerActiveTurnGradientColor: "Poker Active Turn",
  pokerSelectBodyColor: "Poker Select Body",
  pokerSelectCustomStyleBgColor: "Poker Custom Style BG",
  pokerTableStyleBgColor: "Poker Table Style BG",
  pokerChatGradient1: "Poker Chat Gradient 1",
  pokerChatGradient2: "Poker Chat Gradient 2",
  playerCardIconContainerGradient1: "Player Card Icon Container 1",
  playerCardIconContainerGradient2: "Player Card Icon Container 2",
  playerWithSeatContainerGradient1: "Player With Seat Container 1",
  playerWithSeatContainerGradient2: "Player With Seat Container 2",
  playerWithSeatContainerGradient3: "Player With Seat Container 3",
  playerOutContainerGradient1: "Player Out Container 1",
  playerOutContainerGradient2: "Player Out Container 2",
  p2pBlurEffectGradColor: "P2P Blur Effect",
  p2pSidebarGrad1: "P2P Sidebar Gradient 1",
  p2pSidebarGrad2: "P2P Sidebar Gradient 2",
  p2pChallengeBoxGrad1: "P2P Challenge Box 1",
  p2pChallengeBoxGrad2: "P2P Challenge Box 2",
  pikkemPlayerPositionDefaultBg: "Pikkem Player Position BG",
  pikkemPlayerCardDefaultGradientColor: "Pikkem Player Card Gradient",
  pikkemPlayerPositionDefaultBg2: "Pikkem Player Position BG 2",
  pikkemWonColor: "Pikkem Won",
  pikkemLostColor: "Pikkem Lost",
  pikkemPendingColor: "Pikkem Pending",
  pikkemDividerDotColor: "Pikkem Divider Dot",
  pikkemLeaderboardHeaderColor: "Pikkem Leaderboard Header",
  pikkemTeamPositionBorderColor: "Pikkem Team Position Border",
  pikkemSliderBgColor: "Pikkem Slider BG",
  pikkemDeleteIconBg: "Pikkem Delete Icon BG",
  pikkemDeleteIconColor: "Pikkem Delete Icon Color",
  pikkemSuccessBg: "Pikkem Success BG",
  pikkemSuccessBorderColor: "Pikkem Success Border",
  pikkemErrorBg: "Pikkem Error BG",
  pikkemErrorBorderColor: "Pikkem Error Border",
  gamepassDividerGradEndColor: "Gamepass Divider Grad End",
  gamepassPremiumXpMarkerBgColorStart: "Premium XP Marker BG Start",
  gamepassPremiumXpMarkerBgColorEnd: "Premium XP Marker BG End",
  gamepassPremiumXpMarkerBorderColor: "Premium XP Marker Border",
  gamepassActiveColor: "Gamepass Active Color",
  gamepassProgressColor: "Gamepass Progress Color",
  gamepassSliderGradColor1: "Gamepass Slider 1",
  gamepassSliderGradColor2: "Gamepass Slider 2",
  gamepassSliderGradColor3: "Gamepass Slider 3",
  gamepassPremiumSliderGradColor1: "Premium Slider 1",
  gamepassPremiumSliderGradColor2: "Premium Slider 2",
  gamepassCompletedTaskBgGrad1: "Completed Task BG 1",
  gamepassCompletedTaskBgGrad2: "Completed Task BG 2",
  gamepassGoldGradient1: "Gamepass Gold 1",
  gamepassGoldGradient2: "Gamepass Gold 2",
  gamepassGoldGradient3: "Gamepass Gold 3",
  gamepassGoldReverseGradient1: "Gamepass Gold Reverse 1",
  gamepassGoldReverseGradient2: "Gamepass Gold Reverse 2",
  gamepassDarkGradient1: "Gamepass Dark Gradient 1",
  gamepassDarkGradient2: "Gamepass Dark Gradient 2",
  gamepassSpinGradient1: "Gamepass Spin Gradient 1",
  gamepassSpinGradient2: "Gamepass Spin Gradient 2",
  gamepassSpinGradient3: "Gamepass Spin Gradient 3",
  gameLeagueOrderGradient1: "League Order Gradient 1",
  gameLeagueOrderGradient2: "League Order Gradient 2",
  gameLeagueOrderGradient3: "League Order Gradient 3",
  leagueOrderBg: "League Order BG",
  premiumGradStartColor: "Premium Grad Start",
  premiumGradEndColor: "Premium Grad End",
  premiumBoxShadowLayer1: "Premium Box Shadow 1",
  premiumBoxShadowLayer2: "Premium Box Shadow 2",
  premiumBoxShadowLayer3: "Premium Box Shadow 3",
  spinWheelShadow: "Spin Wheel Shadow",
  spinButtonShadow: "Spin Button Shadow",
  spinOverlayGradSecondary: "Spin Overlay Secondary",
  spinGradColor1: "Spin Gradient 1",
  spinGradColor2: "Spin Gradient 2",
  gamePassThumbColor: "Game Pass Thumb",
  gamePassThumbColor2: "Game Pass Thumb 2",
  muiSliderMarkcolor: "MUI Slider Mark",
  muiSliderMarkcolor2: "MUI Slider Mark 2",
  gamePassProgressGradient1: "Game Pass Progress 1",
  gamePassProgressGradient2: "Game Pass Progress 2",
  gamePassProgressGradient3: "Game Pass Progress 3",
  ncaaAthleteCardGradient1: "NCAA Athlete Card Gradient",
  shadowCardBlurLayerGradEnd: "Shadow Card Blur End",
  animationCardBorderGrad1: "Animation Card Border 1",
  animationCardBorderGrad2: "Animation Card Border 2",
  animationCardBorderGrad3: "Animation Card Border 3",
  animationCardBorderGrad4: "Animation Card Border 4",
  animationCardBorderGrad5: "Animation Card Border 5",
  messageBubbleGradient1: "Message Bubble Gradient 1",
  messageBubbleGradient2: "Message Bubble Gradient 2",
  casinoCardLayerGradColor1: "Casino Card Layer 1",
  casinoCardLayerGradColor2: "Casino Card Layer 2",
  casinoCardLayerGradColor3: "Casino Card Layer 3",
  casinoGameBorderGrad1: "Casino Game Border 1",
  casinoGameBorderGrad2: "Casino Game Border 2",
  supportPopupGradientColor1: "Support Popup Gradient 1",
  supportPopupGradientColor2: "Support Popup Gradient 2",
  roulettWheelShadow1: "Roulette Wheel Shadow 1",
  roulettWheelShadow2: "Roulette Wheel Shadow 2",
  pamChartCanceledBg: "PAM Chart — Canceled",
  pamChartExpiredBg: "PAM Chart — Expired",
  pamChartPendingReviewBg: "PAM Chart — Pending Review",
  pamChartVerifiedBg: "PAM Chart — Verified",
  pamChartActiveBg: "PAM Chart — Active",
  pamChartFailedBg: "PAM Chart — Failed",
  pamChartNotVerifiedBg: "PAM Chart — Not Verified",
  pamChartPurchaseBg: "PAM Chart — Purchase",
  pamChartWithdrawalsBg: "PAM Chart — Withdrawals",
  pamChartRevenueBg: "PAM Chart — Revenue",
  pamChartSportsradarBg: "PAM Chart — SportsRadar",
  pamChartDstBg: "PAM Chart — DST",
  pamChartAcceptedBg: "PAM Chart — Accepted",
  pamChartRejectedBg: "PAM Chart — Rejected",
  pamChartPrizeRedemptionsBg: "PAM Chart — Prize Redemptions",
  pushBackgroundColor: "Push Background",
  pushBorderGradSecondaryColor: "Push Border Secondary",
  pushBetcardGradColors1: "Push Bet Card Gradient 1",
  pushBetcardGradColors2: "Push Bet Card Gradient 2",
  pushGradient1: "Push Gradient 1",
  pushGradient2: "Push Gradient 2",
  pushNotificationGradient1: "Push Notification Gradient 1",
  pushNotificationGradient2: "Push Notification Gradient 2",
  neutralButtonGradient1: "Neutral Button Gradient 1",
  neutralButtonGradient2: "Neutral Button Gradient 2",
  neutralButtonGradient3: "Neutral Button Gradient 3",
  betStatusNeutralGradient1: "Bet Status Neutral 1",
  betStatusNeutralGradient2: "Bet Status Neutral 2",
  sportbookProfileBgColor: "Sportsbook Profile BG",
  sportsbookDarkContainerGradient1: "Sportsbook Dark Container 1",
  sportsbookDarkContainerGradient2: "Sportsbook Dark Container 2",
  sportsbookTransparentGradient1: "Sportsbook Transparent 1",
  sportsbookTransparentGradient2: "Sportsbook Transparent 2",
  blackSolidGradient1: "Black Solid Gradient 1",
  blackSolidGradient2: "Black Solid Gradient 2",
  onboardingTopBgGrad1: "Onboarding Top BG 1",
  onboardingTopBgGrad2: "Onboarding Top BG 2",
  purchaseBonusCardActiveBg: "Purchase Bonus Card Active BG",
  topLeftIconBg1: "Top Left Icon BG 1",
  topLeftIconBg2: "Top Left Icon BG 2",
  vsColor: "VS Color",
  earthyBrown: "Earthy Brown",
  bronzeColor: "Bronze Color",
  unlockIconPrimaryColor: "Unlock Icon Primary",
  linearGradientColor: "Linear Gradient Color",
  radioButtonFocusStyle: "Radio Button Focus",
  radioButtonCheckedStyle: "Radio Button Checked",
  activeMarketListGradBg: "Active Market List BG",
  betpostCardBorderGradPrimary: "Bet Post Card Border Primary",
  cashCoinContainerBgGrad1: "Cash Coin Container BG 1",
  cashCoinContainerBgGrad2: "Cash Coin Container BG 2",
};

// ---------------------------------------------------------------------------
// Unresolved fields — in task spec but absent from TCM color spec
// No default values available from the spec for these fields.
// ---------------------------------------------------------------------------

export const UNRESOLVED_FIELDS: (keyof TCMPalette)[] = [
  "pokerCheckButtonColor",
  "pokerCallButtonColor",
  "pokerRaiseButtonColor",
  "pokerTimerColor",
  "pokerChatIconColor",
  "linearGradientColor",
];
