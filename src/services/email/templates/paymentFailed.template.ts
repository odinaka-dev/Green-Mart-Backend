type PaymentFailedProps = {
  fullName: string;
  orderNumber: string;
  retryUrl: string;
};

export const paymentFailedTemplate = ({
  fullName,
  orderNumber,
  retryUrl,
}: PaymentFailedProps) => {
  return `
  <html lang="en">
  <body style="margin:0;padding:40px 16px;background:#f6f6f6;font-family:'DM Sans',Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:28px 40px;">
        <h1 style="color:#fff;font-size:20px;margin:0;">Payment Unsuccessful</h1>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
          Hi ${fullName}, we couldn't confirm payment for your order
          <strong>${orderNumber}</strong>. Your order is saved and no items were shipped.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
          You can retry payment using the button below.
        </p>
        <a href="${retryUrl}"
          style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 32px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-radius:2px;">
          Retry Payment
        </a>
      </div>
    </div>
  </body>
  </html>`;
};
