export const PSP_CATEGORIES = {
  africa: [
    "Paystack", "Flutterwave", "OPay", "PalmPay", "Squad", "Monnify",
    "M-Pesa", "Mukuru", "Yellowpay", "Cellulant", "Pesapal", "MFS Africa",
    "Ozow", "PayFast", "Peach Payments", "NETcash", "Interswitch", "Remita", "Yoco",
  ],
  latam: [
    "EBANX", "dLocal", "AstroPay", "MercadoPago", "PIX Direct", "SafetyPay",
    "Conekta", "Openpay", "Kushki", "Payku", "PicPay", "PagSeguro",
    "Webpay", "Khipu", "RapiPago", "Pago Fácil",
  ],
  crypto: [
    "Bitolo", "Triple-A", "MoonPay", "BitPay", "CoinPayments",
    "Coinbase Commerce", "NOWPayments", "Confirmo", "CryptoProcessing", "Utorg",
  ],
  global: [
    "Worldpay", "NMI", "Finix", "Aeropay", "Evervault", "Adyen", "Stripe",
    "Checkout.com", "Paysafe", "Skrill", "Neteller", "ecoPayz", "Trustly",
    "Klarna", "Sofort", "GiroPay", "Boku", "Apple Pay", "Google Pay",
  ],
  igaming: [
    "PaymentIQ", "Praxis Cashier", "EMerchantPay", "Nuvei", "Continent 8",
    "iSignthis", "Intergiro", "Dimoco", "Jeton", "MuchBetter", "Cashlib",
    "Inpay", "Rapid Transfer",
  ],
} as const;

export const PSP_BY_COUNTRY: Record<string, string[]> = {
  nigeria: ["Paystack", "Flutterwave", "OPay", "PalmPay", "Squad", "Monnify", "Interswitch"],
  south_africa: ["PayFast", "Peach Payments", "Ozow", "NETcash", "Yoco"],
  kenya: ["M-Pesa", "Pesapal", "Cellulant", "Flutterwave"],
  ghana: ["Paystack", "Flutterwave", "MFS Africa"],
  tanzania: ["M-Pesa", "Cellulant", "MFS Africa"],
  ethiopia: ["Cellulant", "MFS Africa"],
  zimbabwe: ["Mukuru", "M-Pesa", "Cellulant"],
  zambia: ["Mukuru", "M-Pesa", "Cellulant"],
  uganda: ["M-Pesa", "Cellulant", "MFS Africa"],
  brazil: ["PIX Direct", "EBANX", "PicPay", "PagSeguro", "MercadoPago"],
  mexico: ["MercadoPago", "Conekta", "Openpay", "EBANX"],
  argentina: ["MercadoPago", "Pago Fácil", "RapiPago", "AstroPay"],
  colombia: ["EBANX", "Kushki", "MercadoPago"],
  chile: ["Webpay", "Khipu", "Kushki"],
  peru: ["EBANX", "SafetyPay", "Kushki"],
};

export const CATEGORY_LABELS: Record<keyof typeof PSP_CATEGORIES, string> = {
  africa: "Africa",
  latam: "LATAM",
  crypto: "Crypto / Stablecoin",
  global: "Global Tier-1",
  igaming: "iGaming Specialized",
};

export function getSuggestedPSPs(country: string): string[] {
  if (!country) return [];
  const lower = country.toLowerCase();
  const match = Object.entries(PSP_BY_COUNTRY).find(([k]) => lower.includes(k));
  return match ? match[1] : [];
}

export function getCountryLabel(country: string): string {
  if (!country) return "";
  const lower = country.toLowerCase();
  const match = Object.keys(PSP_BY_COUNTRY).find((k) => lower.includes(k));
  if (!match) return country;
  return match.charAt(0).toUpperCase() + match.slice(1).replace(/_/g, " ");
}
