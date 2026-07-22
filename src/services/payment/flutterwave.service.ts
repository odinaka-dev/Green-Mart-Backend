import crypto from "crypto";
import {
  paymentConfig,
  assertFlutterwaveConfigured,
} from "../../config/payment";
import { AppError } from "../../utils/apiResponse";

interface InitializePaymentInput {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl?: string;
  customer: { email: string; name?: string; phonenumber?: string };
  meta?: Record<string, any>;
  paymentOptions?: string;
}

/**
 * Thin, server-side-only client for the Flutterwave v3 API. All requests are
 * authenticated with FLW_SECRET_KEY and never exposed to the frontend.
 */
export class FlutterwavePaymentService {
  private static get baseUrl() {
    return paymentConfig.flutterwave.baseUrl;
  }

  private static get headers() {
    return {
      Authorization: `Bearer ${paymentConfig.flutterwave.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  private static async request(path: string, init: RequestInit) {
    assertFlutterwaveConfigured();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: this.headers,
      });
    } catch (err: any) {
      throw new AppError(
        `Unable to reach payment provider: ${err.message}`,
        502,
      );
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body?.status === "error") {
      const message = body?.message || "Payment provider request failed";
      throw new AppError(
        message,
        response.status === 200 ? 502 : response.status,
      );
    }

    return body;
  }

  /**
   * Initialize a hosted-checkout payment. Returns the Flutterwave payment link
   * the customer is redirected to.
   */
  static async initializePayment(input: InitializePaymentInput): Promise<{
    link: string;
    raw: any;
  }> {
    const payload = {
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.redirectUrl || paymentConfig.redirectUrl,
      payment_options: input.paymentOptions || "card,banktransfer,ussd",
      customer: input.customer,
      meta: input.meta || {},
      customizations: {
        title: "Green Mart",
        description: `Payment for order ${input.meta?.orderNumber || input.txRef}`,
      },
    };

    const body = await this.request("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!body?.data?.link) {
      throw new AppError(
        "Payment provider did not return a checkout link",
        502,
      );
    }

    return { link: body.data.link, raw: body };
  }

  /**
   * Verify a transaction by Flutterwave's numeric transaction id (from the
   * webhook / redirect). This is the authoritative source of payment truth.
   */
  static async verifyTransactionById(transactionId: string | number) {
    const body = await this.request(`/transactions/${transactionId}/verify`, {
      method: "GET",
    });
    return body.data;
  }

  /**
   * Verify a transaction by our own tx_ref. Used when only the reference is
   * known (e.g. redirect callback without a transaction id).
   */
  static async verifyByReference(txRef: string) {
    const body = await this.request(
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { method: "GET" },
    );
    return body.data;
  }

  /**
   * Refund a (portion of a) transaction.
   */
  static async refund(transactionId: string | number, amount?: number) {
    const body = await this.request(`/transactions/${transactionId}/refund`, {
      method: "POST",
      body: JSON.stringify(amount ? { amount } : {}),
    });
    return body.data;
  }

  /**
   * Verify an inbound webhook. Flutterwave sends the dashboard "Secret hash"
   * verbatim in the `verif-hash` header — compare it in constant time.
   */
  static verifyWebhookSignature(signature?: string): boolean {
    const expected = paymentConfig.flutterwave.secretHash;
    if (!expected || !signature) return false;
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}
