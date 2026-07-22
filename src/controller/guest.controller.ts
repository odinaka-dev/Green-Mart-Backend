import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import Guest from "../model/guest.model";

export const createGuestSession = async (req: Request, res: Response) => {
  try {
    const guestId = crypto.randomUUID();

    const guest = await Guest.create({
      guestId,
      cart: [],
      favorites: [],
    });

    const token = jwt.sign(
      {
        id: guest._id,
        type: "guest",
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      success: true,
      guestToken: token,
      guestId,
      expiresAt: guest.expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create guest session",
    });
  }
};
