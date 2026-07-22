import mongoose from "mongoose";
import Inventory from "../model/inventory.model";
import { AppError } from "../utils/apiResponse";

/**
 * Ensure an inventory row exists for a (product, variant) pair.
 * Used when creating products/variants so every sellable unit is tracked.
 */
export const ensureInventory = async (
  product: mongoose.Types.ObjectId | string,
  variant: mongoose.Types.ObjectId | string | null,
  quantity = 0,
) => {
  return Inventory.findOneAndUpdate(
    { product, variant: variant ?? null },
    { $setOnInsert: { product, variant: variant ?? null, quantity } },
    { upsert: true, new: true },
  );
};

/**
 * Return available stock for a (product, variant) pair. Returns 0 when no
 * inventory row exists.
 */
export const getAvailableStock = async (
  product: mongoose.Types.ObjectId | string,
  variant: mongoose.Types.ObjectId | string | null = null,
): Promise<number> => {
  const inv = await Inventory.findOne({ product, variant: variant ?? null });
  return inv ? inv.quantity : 0;
};

/**
 * Atomically decrement stock for a single line inside an existing Mongoose
 * session/transaction. Throws (rolling the transaction back) when there is
 * insufficient stock, preventing overselling under concurrency.
 */
export const deductStock = async (
  product: mongoose.Types.ObjectId | string,
  variant: mongoose.Types.ObjectId | string | null,
  quantity: number,
  session: mongoose.ClientSession,
  productName = "product",
) => {
  // The `quantity: { $gte: quantity }` guard makes the decrement conditional
  // and atomic — concurrent requests cannot drive stock below zero.
  const updated = await Inventory.findOneAndUpdate(
    { product, variant: variant ?? null, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { new: true, session },
  );

  if (!updated) {
    throw new AppError(`Insufficient stock for ${productName}`, 409);
  }

  return updated;
};
