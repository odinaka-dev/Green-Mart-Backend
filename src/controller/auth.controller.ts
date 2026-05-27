import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../model/user.model";
import { LoginUserService, registerUserService } from "../services/auth.service";
import bcrypt from "bcryptjs";

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Safely decode an optional guest token from the request body.
 * Returns the Guest MongoDB _id string when the token is valid, or
 * undefined when the token is absent, invalid, or not a guest token.
 * Never throws — a bad guest token should never break login/register.
 */
const extractGuestMongoId = (guestToken?: string): string | undefined => {
  if (!guestToken) return undefined;
  try {
    const decoded = jwt.verify(
      guestToken,
      process.env.JWT_SECRET!,
    ) as JwtPayload;
    if (decoded.type === "guest" && decoded.id) {
      return decoded.id as string;
    }
  } catch {
    // Expired or tampered token — proceed without merge
  }
  return undefined;
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUserController = async (req: Request, res: Response) => {
  const { guestToken, ...body } = req.body;
  const guestMongoId = extractGuestMongoId(guestToken);

  const result = await registerUserService(body, guestMongoId);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUserController = async (req: Request, res: Response) => {
  const { guestToken, ...body } = req.body;
  const guestMongoId = extractGuestMongoId(guestToken);

  const result = await LoginUserService(body, guestMongoId);

  res.status(200).json({
    success: true,
    message: "Login Successful",
    data: result,
  });
};

// ─── Forgot password ──────────────────────────────────────────────────────────

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate 5-digit OTP
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();

    user.passwordResetToken = resetCode;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await user.save();

    // TODO: swap console.log for the real transporter.sendMail call
    console.log(`[dev] Password reset code for ${email}: ${resetCode}`);

    return res.status(200).json({
      success: true,
      message: "Reset password code sent to your email",
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    // passwordResetToken is the field on the User model (was wrongly queried as resetPasswordCode)
    const user = await User.findOne({
      email,
      passwordResetToken: code,
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    if (Number(user.passwordResetExpires) < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired. Please request a new one.",
      });
    }

    return res.status(200).json({ success: true, message: "Code verified" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Reset password ───────────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    // same fix: use passwordResetToken, not resetPasswordCode
    const user = await User.findOne({
      email,
      passwordResetToken: code,
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    if (Number(user.passwordResetExpires) < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
