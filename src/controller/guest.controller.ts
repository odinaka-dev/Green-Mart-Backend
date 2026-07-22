import crypto from "crypto";
import { Request, Response } from "express";
import Guest from "../model/guest.model";

/**
 * Create an anonymous guest session.
 *
 * Guest checkout requires NO authentication — this simply mints a random
 * guestId the frontend stores (e.g. localStorage) and sends on cart requests
 * via the `x-guest-id` header. No JWT is issued for shopping.
 */
export const createGuestSession = async (req: Request, res: Response) => {
  try {
    const guestId = crypto.randomUUID();

    const guest = await Guest.create({
      guestId,
      cart: [],
      favorites: [],
    });

    return res.status(201).json({
      success: true,
      message: "Guest session created",
      data: {
        guestId,
        expiresAt: guest.expiresAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create guest session",
    });
  }
};
