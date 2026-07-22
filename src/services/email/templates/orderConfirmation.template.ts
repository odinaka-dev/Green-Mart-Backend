type OrderItemLine = {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderConfirmationProps = {
  fullName: string;
  orderNumber: string;
  items: OrderItemLine[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
};

const money = (n: number, currency: string) =>
  `${currency} ${Number(n || 0).toLocaleString()}`;

export const orderConfirmationTemplate = ({
  fullName,
  orderNumber,
  items,
  subtotal,
  discountTotal,
  shippingFee,
  taxTotal,
  grandTotal,
  currency,
}: OrderConfirmationProps) => {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">
          ${i.productName} <span style="color:#999;">× ${i.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:right;">
          ${money(i.lineTotal, currency)}
        </td>
      </tr>`,
    )
    .join("");

  const summaryRow = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:6px 0;color:${bold ? "#0a0a0a" : "#666"};font-size:${bold ? "15px" : "13.5px"};font-weight:${bold ? "700" : "400"};">${label}</td>
      <td style="padding:6px 0;text-align:right;color:${bold ? "#0a0a0a" : "#666"};font-size:${bold ? "15px" : "13.5px"};font-weight:${bold ? "700" : "400"};">${value}</td>
    </tr>`;

  return `
  <html lang="en">
  <body style="margin:0;padding:40px 16px;background:#f6f6f6;font-family:'DM Sans',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:28px 40px;">
        <h1 style="color:#fff;font-size:20px;margin:0;">Green Mart</h1>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;margin:0 0 8px;">Order Confirmed</p>
        <h2 style="font-size:22px;color:#0a0a0a;margin:0 0 16px;">Thank you, ${fullName}!</h2>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 8px;">
          We've received your order <strong>${orderNumber}</strong> and payment was successful.
          We'll notify you when it ships.
        </p>

        <table style="width:100%;border-collapse:collapse;margin:24px 0 8px;">
          ${rows}
        </table>

        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          ${summaryRow("Subtotal", money(subtotal, currency))}
          ${discountTotal > 0 ? summaryRow("Discount", `- ${money(discountTotal, currency)}`) : ""}
          ${summaryRow("Shipping", money(shippingFee, currency))}
          ${taxTotal > 0 ? summaryRow("Tax", money(taxTotal, currency)) : ""}
          ${summaryRow("Total", money(grandTotal, currency), true)}
        </table>
      </div>
      <div style="padding:20px 40px 32px;">
        <p style="font-size:12px;color:#999;margin:0;">
          Questions? Contact us at
          <a href="mailto:hello@greenmart.com" style="color:#c9a84c;text-decoration:none;">hello@greenmart.com</a>.
        </p>
      </div>
    </div>
  </body>
  </html>`;
};
