import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../model/product.model";
import ProductVariant from "../model/productVariant.model";
import { getAvailableStock } from "../services/inventory.service";
import {
  resolveGuest,
  buildCartSummary,
} from "../services/cart.service";
import { AppError } from "../utils/apiResponse";

// The public guestId travels in the `x-guest-id` header (fallback: body/query).
const getGuestId = (req: Request): string | undefined =>
  (req.headers["x-guest-id"] as string) ||
  (req.body && req.body.guestId) ||
  (req.query.guestId as string);

// Two cart lines match when they reference the same product AND same variant.
const sameLine = (line: any, productId: string, variantId?: string | null) =>
  line.productId.toString() === productId &&
  (line.variantId ? line.variantId.toString() : null) === (variantId || null);

// ─── Add to cart ──────────────────────────────────────────────────────────────
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, variantId = null, quantity = 1 } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid productId is required" });
    }
    const qty = Number(quantity) || 1;
    if (qty < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isActive === false) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found or unavailable" });
    }

    if (variantId) {
      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ success: false, message: "Invalid variantId" });
      }
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: { $ne: false },
      });
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found for this product" });
      }
    }

    const guest = await resolveGuest(getGuestId(req));

    const existing = guest.cart.find((l: any) => sameLine(l, productId, variantId));
    const desiredQty = (existing?.quantity ?? 0) + qty;

    // Never let the cart exceed available stock.
    const stock = await getAvailableStock(productId, variantId || null);
    if (stock < desiredQty) {
      return res.status(409).json({
        success: false,
        message: `Only ${stock} unit(s) available`,
      });
    }

    if (existing) {
      existing.quantity = desiredQty;
    } else {
      guest.cart.push({ productId, variantId: variantId || null, quantity: qty });
    }

    await guest.save();
    const summary = await buildCartSummary(guest);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: summary,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};

// ─── Get cart (with live pricing) ─────────────────────────────────────────────
export const getCart = async (req: Request, res: Response) => {
  try {
    const guest = await resolveGuest(getGuestId(req));
    const summary = await buildCartSummary(guest);

    return res.status(200).json({ success: true, data: summary });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};

// ─── Update quantity of a cart line ───────────────────────────────────────────
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { productId, variantId = null, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId and quantity are required",
      });
    }
    const qty = Number(quantity);

    const guest = await resolveGuest(getGuestId(req));
    const line = guest.cart.find((l: any) => sameLine(l, productId, variantId));

    if (!line) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    // Quantity 0 (or less) removes the line.
    if (qty <= 0) {
      guest.set(
        "cart",
        guest.cart.filter((l: any) => !sameLine(l, productId, variantId)),
      );
    } else {
      const stock = await getAvailableStock(productId, variantId || null);
      if (stock < qty) {
        return res
          .status(409)
          .json({ success: false, message: `Only ${stock} unit(s) available` });
      }
      line.quantity = qty;
    }

    await guest.save();
    const summary = await buildCartSummary(guest);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      data: summary,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};

// ─── Remove a line from cart ──────────────────────────────────────────────────
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const variantId = (req.query.variantId as string) || null;

    const guest = await resolveGuest(getGuestId(req));

    guest.set(
      "cart",
      guest.cart.filter((l: any) => !sameLine(l, productId, variantId)),
    );

    await guest.save();
    const summary = await buildCartSummary(guest);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: summary,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};

// ─── Clear cart ───────────────────────────────────────────────────────────────
export const clearCart = async (req: Request, res: Response) => {
  try {
    const guest = await resolveGuest(getGuestId(req));
    guest.set("cart", []);
    await guest.save();

    return res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};
