type ReceiptProps = {
  fullName: string;
  orderNumber: string;
  reference: string;
  amount: number;
  currency: string;
  paidAt: string;
};

const money = (n: number, currency: string) =>
  `${currency} ${Number(n || 0).toLocaleString()}`;

export const receiptTemplate = ({
  fullName,
  orderNumber,
  reference,
  amount,
  currency,
  paidAt,
}: ReceiptProps) => {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:#666;font-size:13.5px;">${label}</td>
      <td style="padding:8px 0;text-align:right;color:#0a0a0a;font-size:13.5px;font-weight:500;">${value}</td>
    </tr>`;

  return `
  <html lang="en">
  <body style="margin:0;padding:40px 16px;background:#f6f6f6;font-family:'DM Sans',Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:28px 40px;">
        <h1 style="color:#fff;font-size:20px;margin:0;">Payment Receipt</h1>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
          Hi ${fullName}, here is your receipt for order <strong>${orderNumber}</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;">
          ${row("Order Number", orderNumber)}
          ${row("Reference", reference)}
          ${row("Date", paidAt)}
          ${row("Amount Paid", money(amount, currency))}
        </table>
        <p style="margin-top:24px;font-size:12px;color:#999;">
          This receipt confirms your payment was received successfully.
        </p>
      </div>
    </div>
  </body>
  </html>`;
};
