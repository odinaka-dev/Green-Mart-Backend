import { resend } from "./resend.service";
import { otpTemplate } from "./templates/otp.template";
import { welcomeTemplate } from "./templates/welcome.template";
import { orderConfirmationTemplate } from "./templates/orderConfirmation.template";
import { receiptTemplate } from "./templates/receipt.template";
import { paymentFailedTemplate } from "./templates/paymentFailed.template";

const FROM = "Green Mart <onboarding@resend.dev>";

export class EmailService {
  static async sendOtpEmail({
    email,
    fullName,
    otp,
  }: {
    email: string;
    fullName: string;
    otp: string;
  }) {
    return resend.emails.send({
      from: "WearVBO <onboarding@resend.dev>",
      to: email,
      subject: "Your Verification Code",
      html: otpTemplate({
        fullName,
        otp,
      }),
    });
  }

  static async sendWelcomeEmail({
    email,
    fullName,
  }: {
    email: string;
    fullName: string;
  }) {
    return resend.emails.send({
      from: "WearVBO <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to WearVBO",
      html: welcomeTemplate({
        fullName,
      }),
    });
  }

  static async sendOrderConfirmationEmail({ order }: { order: any }) {
    return resend.emails.send({
      from: FROM,
      to: order.customer.email,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: orderConfirmationTemplate({
        fullName: order.customer.fullName,
        orderNumber: order.orderNumber,
        items: order.items.map((i: any) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shippingFee: order.shippingFee,
        taxTotal: order.taxTotal,
        grandTotal: order.grandTotal,
        currency: order.currency,
      }),
    });
  }

  static async sendPaymentReceiptEmail({ order }: { order: any }) {
    return resend.emails.send({
      from: FROM,
      to: order.customer.email,
      subject: `Payment Receipt — ${order.orderNumber}`,
      html: receiptTemplate({
        fullName: order.customer.fullName,
        orderNumber: order.orderNumber,
        reference: order.paymentReference,
        amount: order.grandTotal,
        currency: order.currency,
        paidAt: new Date().toLocaleString(),
      }),
    });
  }

  static async sendPaymentFailedEmail({ order }: { order: any }) {
    const retryUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/retry?ref=${order.paymentReference}`;
    return resend.emails.send({
      from: FROM,
      to: order.customer.email,
      subject: `Payment Unsuccessful — ${order.orderNumber}`,
      html: paymentFailedTemplate({
        fullName: order.customer.fullName,
        orderNumber: order.orderNumber,
        retryUrl,
      }),
    });
  }
}
