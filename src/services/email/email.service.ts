import { resend } from "./resend.service";
import { otpTemplate } from "./templates/otp.template";
import { welcomeTemplate } from "./templates/welcome.template";

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
}
