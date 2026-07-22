import mongoose from "mongoose";

/**
 * A specific purchasable variation of a Product (e.g. size "L" / colour "red").
 * Pricing lives here (falls back to the parent product price when null).
 * Stock is NOT stored here — the Inventory collection is the single source of
 * truth for quantity, keyed by (product, variant).
 */
const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      lowercase: true,
      trim: true,
    },
    color: {
      type: String,
      lowercase: true,
      trim: true,
    },
    // Optional per-variant price override. When null, the product price is used.
    price: {
      type: Number,
      default: null,
      min: 0,
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);
export default ProductVariant;
