import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../model/product.model";
import ProductVariant from "../model/productVariant.model";
import Inventory from "../model/inventory.model";
import { ensureInventory, getAvailableStock } from "../services/inventory.service";

// ─── Create a variant for a product (admin) ───────────────────────────────────
export const createVariant = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const { sku, size, color, price, stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variant = await ProductVariant.create({
      product: product._id,
      sku,
      size,
      color,
      price: price !== undefined && price !== null ? Number(price) : null,
    });

    // Mark the product as variant-based and seed the variant's stock.
    if (!product.hasVariants) {
      product.set("hasVariants", true);
      await product.save();
    }
    await ensureInventory(product._id, variant._id, Number(stock) || 0);

    return res.status(201).json({ success: true, variant });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── List variants for a product (public) ─────────────────────────────────────
export const getVariants = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const variants = await ProductVariant.find({ product: productId }).lean();
    const withStock = await Promise.all(
      variants.map(async (v) => ({
        ...v,
        stock: await getAvailableStock(productId, v._id),
      })),
    );

    return res.status(200).json({ success: true, data: withStock });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update a variant (admin) ─────────────────────────────────────────────────
export const updateVariant = async (req: Request, res: Response) => {
  try {
    const variantId = req.params.variantId as string;
    const { sku, size, color, price, stock, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant id" });
    }

    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    if (sku !== undefined) variant.set("sku", sku);
    if (size !== undefined) variant.set("size", size);
    if (color !== undefined) variant.set("color", color);
    if (price !== undefined) variant.set("price", price === null ? null : Number(price));
    if (isActive !== undefined) variant.set("isActive", isActive);
    await variant.save();

    if (stock !== undefined) {
      await Inventory.findOneAndUpdate(
        { product: variant.product, variant: variant._id },
        { $set: { quantity: Number(stock) || 0 } },
        { upsert: true },
      );
    }

    return res.status(200).json({ success: true, variant });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
