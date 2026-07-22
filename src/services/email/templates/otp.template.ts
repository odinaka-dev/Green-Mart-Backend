type OtpTemplateProps = {
  fullName: string;
  otp: string;
};

export const otpTemplate = ({ fullName, otp }: OtpTemplateProps) => {
  const otpBoxes = otp
    .split("")
    .map(
      (digit) => `
      <td
        align="center"
        valign="middle"
        width="64"
        height="72"
        style="
          border:1.5px solid #ddd;
          border-bottom:3px solid #c9a84c;
          font-size:32px;
          font-weight:700;
          color:#0a0a0a;
          background:#fafafa;
        "
      >
        ${digit}
      </td>
    `,
    )
    .join("");

  return `
   <html lang="en">
  <head> </head>
  <body style="margin:0;padding:40px 16px;background:#ffffff;font-family:'DM Sans',sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:28px 40px;display:flex;align-items:center;justify-content:space-between;">
        <img
          src="https://res.cloudinary.com/dunbtzcxd/image/upload/v1780360591/new-white_duckmc"
          alt="WearVBO"
          style="height:36px;"
        />
        <div style="display:flex;gap:14px;">
          <a href="#" style="color:#aaa;text-decoration:none;font-size:13px;"></a>
          <a href="#" style="color:#aaa;text-decoration:none;font-size:13px;"></a>
          <a href="#" style="color:#aaa;text-decoration:none;font-size:13px;"></a>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 60%,#16213e 100%);padding:44px 40px 36px;">
        <p
          style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;margin:0 0 12px;font-weight:500;"
        >
          Security
        </p>
        <h1 style="font-family:'Playfair Display',serif;font-size:30px;color:#fff;line-height:1.2;margin:0;">
          Confirm Verification Code
        </h1>
        <p style="margin:10px 0 0;color:#a0a0b0;font-size:14px;line-height:1.6;font-weight:300;">
          Use the code below to verify your identity and access your account.
        </p>
      </div>

      <div style="padding:36px 40px;">
        <p style="font-size:15px;color:#222;font-weight:500;margin:0 0 12px;">Hi ${fullName},</p>
        <p style="font-size:14px;color:#555;line-height:1.75;margin:0 0 20px;">
          This is your one-time verification code:
        </p>

        <div styl ="display:flex;gap:12px;margin:0 0 20px;">
          <div style="font-weight:800;height:72px;border:1.5px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#0a0a0a;background:#fafafa;border-bottom:3px solid #c9a84c;">
            ${otp}
          </div>
        </div>

        <p style="font-size:12.5px;color:#999;margin:0 0 20px;">
          This code is valid for the next <strong style="color:#c9a84c;">5 minutes</strong>. Do not share this code with
          anyone.
        </p>

        <p style="font-size:14px;color:#555;line-height:1.75;margin:0 0 24px;">
          Whether you're here for your brand, a cause, or just for fun — welcome! If you didn't request this code, you
          can safely ignore this email.
        </p>

        <a
          href="#"
          style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 36px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;font-weight:500;border-radius:2px;"
          >Verify Email</a
        >

        <p style="margin-top:24px;font-size:14px;color:#444;">
          Thanks,<br /><strong style="color:#0a0a0a;">WearVBO Team</strong>
        </p>
      </div>

      <div style="height:1px;background:#eee;margin:0 40px;"></div>

      <div style="padding:24px 40px 32px;">
        <p style="font-size:12px;color:#999;line-height:1.7;margin:0;">
          Questions or support? Contact us at
          <a href="mailto:hello@wearvbo.com" style="color:#c9a84c;text-decoration:none;">hello@wearvbo.com</a>. If you'd
          rather not receive this kind of email,
          <a href="#" style="color:#c9a84c;text-decoration:none;">Unsubscribe</a>.
        </p>
        <p style="margin-top:14px;font-size:11.5px;color:#bbb;">14 Fashion Avenue, Lagos, Nigeria  ·  © 2025 WearVBO</p>
      </div>
    </div>
  </body>
</html>
  `;
};
