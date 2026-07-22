import mongoose from "mongoose";
import Guest from "../model/guest.model";
import Product from "../model/product.model";
import ProductVariant from "../model/productVariant.model";
import { getAvailableStock } from "./inventory.service";
import { AppError } from "../utils/apiResponse";

export interface PricedCartLine {
  productId: string;
  variantId: string | null;
  productName: string;
  image: string;
  attributes: { size: string | null; color: string | null };
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  inStock: boolean;
  isActive: boolean;
}

export interface CartSummary {
  items: PricedCartLine[];
  subtotal: number;
  itemCount: number;
}

/**
 * Load a Guest document by its public guestId. Throws a 404 AppError when the
 * session does not exist or has expired.
 */
export const resolveGuest = async (guestId?: string) => {
  if (!guestId) {
    throw new AppError(
      "Missing guest session. Provide a guestId (x-guest-id header).",
      400,
    );
  }
  const guest = await Guest.findOne({ guestId });
  if (!guest) {
    throw new AppError(
      "Guest session not found or has expired. Please create a new session.",
      404,
    );
  }
  return guest;
};

/**
 * Build a fully-priced cart summary from a guest's stored cart, pulling live
 * product/variant prices and stock. Never trusts any client-supplied price.
 */
export const buildCartSummary = async (guest: any): Promise<CartSummary> => {
  const items: PricedCartLine[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const line of guest.cart) {
    const product = await Product.findById(line.productId);
    if (!product) continue; // product was deleted — silently drop from summary

    let unitPrice = product.productPrice;
    let variant: any = null;
    let attributes = { size: null as string | null, color: null as string | null };

    if (line.variantId) {
      variant = await ProductVariant.findById(line.variantId);
      if (variant) {
        if (variant.price !== null && variant.price !== undefined) {
          unitPrice = variant.price;
        }
        attributes = { size: variant.size || null, color: variant.color || null };
      }
    }

    const stock = await getAvailableStock(
      product._id,
      line.variantId ? line.variantId : null,
    );
    const quantity = line.quantity || 1;
    const lineTotal = unitPrice * quantity;

    subtotal += lineTotal;
    itemCount += quantity;

    items.push({
      productId: product._id.toString(),
      variantId: line.variantId ? line.variantId.toString() : null,
      productName: product.productName,
      image: product.productImages?.[0]?.url || "",
      attributes,
      unitPrice,
      quantity,
      lineTotal,
      stock,
      inStock: stock >= quantity,
      isActive: product.isActive !== false,
    });
  }

  return { items, subtotal, itemCount };
};

/**
 * Validate a guest's cart for checkout: non-empty, all products active and in
 * stock. Returns the priced summary. Throws AppError on the first problem.
 */
export const validateCartForCheckout = async (guest: any): Promise<CartSummary> => {
  if (!guest.cart || guest.cart.length === 0) {
    throw new AppError("Your cart is empty", 400);
  }

  const summary = await buildCartSummary(guest);

  if (summary.items.length === 0) {
    throw new AppError("Your cart contains no purchasable items", 400);
  }

  for (const item of summary.items) {
    if (!item.isActive) {
      throw new AppError(`"${item.productName}" is no longer available`, 409);
    }
    if (!item.inStock) {
      throw new AppError(
        `"${item.productName}" is out of stock (only ${item.stock} left)`,
        409,
      );
    }
  }

  return summary;
};
