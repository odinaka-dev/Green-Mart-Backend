/**
 * Centralised payment / commerce configuration read from environment variables.
 * Keep all provider secrets and commerce defaults here so they are validated
 * in one place and never hard-coded across the codebase.
 */
export const paymentConfig = {
  flutterwave: {
    baseUrl: process.env.FLW_BASE_URL || "https://api.flutterwave.com/v3",
    secretKey: process.env.FLW_SECRET_KEY || "",
    publicKey: process.env.FLW_PUBLIC_KEY || "",
    // Value configured in the Flutterwave dashboard (Settings → Webhooks → "Secret hash").
    secretHash: process.env.FLW_SECRET_HASH || "",
  },
  // URL Flutterwave redirects the customer back to after payment.
  redirectUrl:
    process.env.PAYMENT_REDIRECT_URL ||
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/callback`,
  defaultCurrency: process.env.DEFAULT_CURRENCY || "NGN",
  // Tax rate as a fraction, e.g. 0.075 for 7.5% VAT. Defaults to 0 (no tax).
  taxRate: Number(process.env.TAX_RATE || 0),
};

export const assertFlutterwaveConfigured = () => {
  if (!paymentConfig.flutterwave.secretKey) {
    const err: any = new Error(
      "Flutterwave is not configured. Set FLW_SECRET_KEY in your environment.",
    );
    err.statusCode = 500;
    throw err;
  }
};
