type WelcomeEmailProps = {
  fullName: string;
};

export const welcomeTemplate = ({ fullName }: WelcomeEmailProps) => {
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

      <div
        style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 60%,#16213e 100%);padding:52px 40px 44px;position:relative;overflow:hidden;"
      >
        <p
          style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;margin:0 0 14px;font-weight:500;"
        >
          Welcome aboard
        </p>
        <h1
          style="font-family:'Playfair Display',serif;font-size:34px;color:#fff;line-height:1.2;font-weight:700;margin:0;"
        >
          Style starts <span style="color:#c9a84c;">here.</span>
        </h1>
        <p style="margin:12px 0 0;color:#a0a0b0;font-size:14px;line-height:1.6;font-weight:300;">
          Your account is ready. Explore curated fashion, exclusive drops, and more.
        </p>
      </div>

      <div style="padding:36px 40px;">
        <p style="font-size:15px;color:#222;font-weight:500;margin:0 0 12px;">Hi ${fullName},</p>
        <p style="font-size:14px;color:#555;line-height:1.75;margin:0 0 16px;">
          Welcome to <strong>WearVBO</strong> — we're glad you're here. Your account has been created and you're all set
          to start exploring our latest collections.
        </p>

        <div
          style="background:#f9f6ef;border-left:3px solid #c9a84c;padding:16px 20px;border-radius:0 4px 4px 0;margin:24px 0;"
        >
          <p style="margin:0;color:#444;font-size:13.5px;line-height:1.7;">
            As a welcome gift, enjoy <strong style="color:#0a0a0a;">3% off your first order</strong> using the code
            <strong style="color:#0a0a0a;">WEARVBO10</strong> at checkout. Valid for the next 7 days.
          </p>
        </div>

        <p style="font-size:14px;color:#555;line-height:1.75;margin:0 0 28px;">
          From everyday essentials to statement pieces, WearVBO is your go-to destination for fashion that moves with
          you.
        </p>

        <a
          href="#"
          style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 36px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;font-weight:500;border-radius:2px;"
          >Shop the Collection</a
        >

        <p style="margin-top:24px;font-size:14px;color:#444;">
          Warm regards,<br /><strong style="color:#0a0a0a;">The WearVBO Team</strong>
        </p>
      </div>

      <div style="height:1px;background:#eee;margin:0 40px;"></div>

      <div style="padding:24px 40px 32px;">
        <p style="font-size:12px;color:#999;line-height:1.7;margin:0;">
          Questions or support? Contact us at
          <a href="mailto:hello@wearvbo.com" style="color:#c9a84c;text-decoration:none;">hello@wearvbo.com</a>. If you'd
          rather not receive this kind of email, you can
          <a href="#" style="color:#c9a84c;text-decoration:none;">Unsubscribe</a>.
        </p>
        <p style="margin-top:14px;font-size:11.5px;color:#bbb;">14 Fashion Avenue, Lagos, Nigeria  ·  © 2025 WearVBO</p>
      </div>
    </div>
  </body>
</html>
  `;
};
