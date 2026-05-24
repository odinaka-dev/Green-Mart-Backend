import { Request, Response } from "express";
import User from "../model/user.model";
import {
  LoginUserService,
  registerUserService,
} from "../services/auth.service";
import transporter from "../config/mail";
import bcrypt from "bcryptjs";

// REGISTER CONTROLLER
export const registerUserController = async (req: Request, res: Response) => {
  const result = await registerUserService(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
};

//LOGIN CONTROLLER
export const loginUserController = async (req: Request, res: Response) => {
  const result = await LoginUserService(req.body);

  res.status(200).json({
    success: true,
    message: "Login Successful",
    data: result,
  });
};

// FORGOT PASSWORD CONTROLLER
export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }

    // generate 5-digit code
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();

    user.passwordResetToken = resetCode;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();
    // send email
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Password Reset Code",

    //   text: `Your password reset code is ${resetCode}`,
    // });
    console.log(`Your password reset code is ${resetCode}`);

    res.status(200).json({
      success: true,
      status: 200,
      message: `Reset password code sent to your email ${resetCode}`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyResetCode = async (req: any, res: any) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordCode: code,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid code",
      });
    }

    // Check expiration
    if (Number(user.passwordResetExpires) < Number(Date.now())) {
      return res.status(400).json({
        success: false,
        message: "Password Reset Code expired, Request for another",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password Reset Code verified",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// RESET PASSWORD CONTROLLER

export const resetPassword = async (req: any, res: any) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordCode: code,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid code",
      });
    }

    // Check expiration
    if (Number(user.passwordResetExpires) < Number(Date.now())) {
      return res.status(400).json({
        success: false,
        message: "Password Reset Code expired, Request for another",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    // Clear reset fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
