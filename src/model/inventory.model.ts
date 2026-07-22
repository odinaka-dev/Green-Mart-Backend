import mongoose from "mongoose";

/**
 * Authoritative stock record for a product (and optionally a specific variant).
 * For products without variants, `variant` is null and there is a single
 * inventory row per product.
 *
 * `quantity`  — units on hand available to sell.
 * `reserved`  — reserved for in-flight orders (reserved for future use).
 */
const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
);

// One inventory row per (product, variant) pair.
inventorySchema.index({ product: 1, variant: 1 }, { unique: true });

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
