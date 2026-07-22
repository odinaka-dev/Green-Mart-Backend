import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      unique: true,
    },
    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        // Optional variant for products sold through ProductVariant rows.
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariant",
          default: null,
        },
        quantity: Number,
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    expiresAt: {
      type: Date,
      default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically remove expired guest documents from MongoDB
guestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Guest = mongoose.model("Guest", guestSchema);
export default Guest;
