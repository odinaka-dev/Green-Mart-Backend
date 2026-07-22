import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../model/user.model";
import Cart from "../model/cart.model";
import Favorite from "../model/favorites.model";
import Guest from "../model/guest.model";
import generateToken from "../utils/generateToken";
import { EmailService } from "../services/email/email.service";

// ─── Guest merge ──────────────────────────────────────────────────────────────

/**
 * Merges a guest session's cart and favorites into the newly authenticated
 * user account, then deletes the guest document to invalidate the guest token.
 *
 * Safe to call even if the guest session has already expired — it simply
 * returns without throwing.
 */
const mergeGuestData = async (
  guestMongoId: string,
  userId: string,
): Promise<void> => {
  const guest = await Guest.findById(guestMongoId);
  if (!guest) return; // session expired or already merged

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // ── Merge cart ──────────────────────────────────────────────────────────────
  if (guest.cart.length > 0) {
    let cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      cart = new Cart({ userId: userObjectId, items: [] });
    }

    for (const guestItem of guest.cart) {
      const productId = (guestItem.productId as any).toString();
      const idx = (cart.items as any[]).findIndex(
        (item: any) => item.productId.toString() === productId,
      );

      if (idx > -1) {
        // Add quantities together — guest wins incremental intent
        (cart.items as any[])[idx].quantity += guestItem.quantity ?? 1;
      } else {
        (cart.items as any[]).push({
          productId: guestItem.productId,
          quantity: guestItem.quantity ?? 1,
        });
      }
    }

    await cart.save();
  }

  // ── Merge favorites ─────────────────────────────────────────────────────────
  for (const productId of guest.favorites) {
    // upsert: silently skips duplicates thanks to the compound unique index
    await Favorite.findOneAndUpdate(
      { userId: userObjectId, productId },
      { userId: userObjectId, productId },
      { upsert: true, new: true },
    );
  }

  // ── Invalidate guest token ──────────────────────────────────────────────────
  // Deleting the document makes any future JWT verification fail at the
  // application level (routes that resolve the guest by _id will 404).
  await Guest.findByIdAndDelete(guestMongoId);
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUserService = async (
  payloads: any,
  guestMongoId?: string,
) => {
  const existingUser = await User.findOne({ email: payloads.email });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(payloads.password, 12);

  const user = await User.create({
    ...payloads,
    password: hashedPassword,
  });

  const token = generateToken(user._id.toString());

  await EmailService.sendWelcomeEmail({
    email: user.email,
    fullName: user.fullName,
  });

  // Merge guest data after account creation (non-blocking — don't fail register on merge error)
  if (guestMongoId) {
    await mergeGuestData(guestMongoId, user._id.toString()).catch((err) =>
      console.error("[guest-merge] register merge failed:", err.message),
    );
  }

  return { user, token };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const LoginUserService = async (
  payloads: any,
  guestMongoId?: string,
) => {
  const user = await User.findOne({ email: payloads.email }).select(
    "+password",
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(
    payloads.password,
    user.password,
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user._id.toString());

  // Merge guest data after successful login
  if (guestMongoId) {
    await mergeGuestData(guestMongoId, user._id.toString()).catch((err) =>
      console.error("[guest-merge] login merge failed:", err.message),
    );
  }

  return { token };
};
