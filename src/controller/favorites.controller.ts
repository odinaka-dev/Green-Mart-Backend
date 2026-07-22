import mongoose from "mongoose";
import Favorite from "../model/favorites.model";
import Guest from "../model/guest.model";

// ─── helpers ─────────────────────────────────────────────────────────────────

const isGuest = (user: any) => user?.type === "guest";

const resolveGuest = async (user: any, res: any) => {
  const guest = await Guest.findById(user.id);
  if (!guest) {
    res.status(404).json({
      success: false,
      message: "Guest session not found or has expired. Please create a new session.",
    });
    return null;
  }
  return guest;
};

// ─── Add favorite ─────────────────────────────────────────────────────────────

export const addFavorite = async (req: any, res: any) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      const alreadyFavorited = guest.favorites.some(
        (id: any) => id.toString() === productId,
      );

      if (alreadyFavorited) {
        return res.status(409).json({ success: false, message: "Product already in favorites" });
      }

      guest.favorites.push(new mongoose.Types.ObjectId(productId));
      await guest.save();

      return res.status(201).json({
        success: true,
        message: "Added to favorites",
        favorites: guest.favorites,
      });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;

    const existing = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "Product already in favorites" });
    }

    const favorite = await Favorite.create({ userId, productId });

    return res.status(201).json({ success: true, message: "Added to favorites", favorite });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get favorites ────────────────────────────────────────────────────────────

export const getFavorites = async (req: any, res: any) => {
  try {
    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      await guest.populate("favorites");

      return res.status(200).json({ success: true, data: guest.favorites });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;

    const favorites = await Favorite.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: favorites });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Remove favorite ──────────────────────────────────────────────────────────

export const removeFavorites = async (req: any, res: any) => {
  try {
    const { productId } = req.params;

    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      const originalLength = guest.favorites.length;
      guest.set(
        "favorites",
        guest.favorites.filter((id: any) => id.toString() !== productId),
      );

      if (guest.favorites.length === originalLength) {
        return res.status(404).json({ success: false, message: "Favorite not found" });
      }

      await guest.save();

      return res.status(200).json({ success: true, message: "Favorite removed successfully" });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;

    const deleted = await Favorite.findOneAndDelete({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Favorite not found" });
    }

    return res.status(200).json({ success: true, message: "Favorite removed successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
