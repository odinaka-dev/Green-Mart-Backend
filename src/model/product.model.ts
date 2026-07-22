import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productDescription: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    sizes: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      lowercase: true,
    },
    availableColors: {
      type: [String],
      default: [],
      lowercase: true,
    },
    productImages: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
      ],
      validate: {
        validator: function (v: any[]) {
          return v.length >= 1 && v.length <= 4;
        },
        message: "Upload between 1 and 4 images",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);
export default Product;
