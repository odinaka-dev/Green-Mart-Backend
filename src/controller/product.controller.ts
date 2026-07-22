import { Request, Response } from "express";
import Product from "../model/product.model";
import ProductVariant from "../model/productVariant.model";
import Inventory from "../model/inventory.model";
import cloudinary from "../config/cloudinary";
import mongoose from "mongoose";
import { ensureInventory, getAvailableStock } from "../services/inventory.service";

const parseArrayField = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v: string) => v.trim().toLowerCase());
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v: string) => v.trim().toLowerCase());
    } catch {
      // comma-separated fallback
      return value.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
};

// ─── Create product (admin) ───────────────────────────────────────────────────
export const createProductController = async (req: Request, res: Response) => {
  try {
    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : (req.files?.productImages as Express.Multer.File[]) || [];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    if (files.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum 4 images allowed",
      });
    }

    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${base64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "products",
        });
        return {
          url: result.secure_url,
          publicId: result.public_id,
        };
      }),
    );

    const { sizes, tags, availableColors, category, stock, ...rest } = req.body;

    const product = await Product.create({
      ...rest,
      category:
        category && mongoose.Types.ObjectId.isValid(category) ? category : null,
      sizes: parseArrayField(sizes),
      tags: parseArrayField(tags),
      availableColors: parseArrayField(availableColors),
      productImages: uploadedImages,
    });

    // Create the base inventory row (variant: null) for a non-variant product.
    await ensureInventory(product._id, null, Number(stock) || 0);

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Update product (admin) ───────────────────────────────────────────────────
export const updateProductController = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : (req.files?.productImages as Express.Multer.File[]) || [];

    // Only replace images when new ones are provided
    if (files && files.length > 0) {
      if (files.length > 4) {
        return res.status(400).json({
          success: false,
          message: "Maximum 4 images allowed",
        });
      }

      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const base64 = file.buffer.toString("base64");
          const dataURI = `data:${file.mimetype};base64,${base64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "products",
          });
          return {
            url: result.secure_url,
            publicId: result.public_id,
          };
        }),
      );

      // remove old images from cloudinary
      await Promise.all(
        product.productImages.map((img: any) =>
          cloudinary.uploader.destroy(img.publicId),
        ),
      );

      product.set("productImages", uploadedImages);
    }

    const { sizes, tags, availableColors, stock, ...rest } = req.body;

    const allowedFields = [
      "productName",
      "productDescription",
      "productPrice",
      "ratings",
      "category",
      "isActive",
      "hasVariants",
    ];
    allowedFields.forEach((field) => {
      if (rest[field] !== undefined) {
        product.set(field, rest[field]);
      }
    });

    if (sizes !== undefined) product.set("sizes", parseArrayField(sizes));
    if (tags !== undefined) product.set("tags", parseArrayField(tags));
    if (availableColors !== undefined)
      product.set("availableColors", parseArrayField(availableColors));

    await product.save();

    // Allow adjusting base (non-variant) stock via update.
    if (stock !== undefined && !product.hasVariants) {
      await Inventory.findOneAndUpdate(
        { product: product._id, variant: null },
        { $set: { quantity: Number(stock) || 0 } },
        { upsert: true },
      );
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Get all products (public) ────────────────────────────────────────────────
export const getProductsController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "newest";
    const collections = (req.query.collections as string) || "";
    const color = (req.query.color as string) || "";
    const category = (req.query.category as string) || "";

    const skip = (page - 1) * limit;

    // Only active products are exposed to shoppers.
    const filter: any = { isActive: { $ne: false } };

    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    if (collections) {
      filter.tags = { $in: collections.split(",").map((t) => t.trim().toLowerCase()) };
    }

    if (color) {
      filter.availableColors = { $in: color.split(",").map((c) => c.trim().toLowerCase()) };
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    let sortOption: any = {};
    switch (sort) {
      case "price_asc":
        sortOption = { productPrice: 1 };
        break;
      case "price_desc":
        sortOption = { productPrice: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select("-__v"),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: products,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── Get single product with variants, stock & related (public) ───────────────
export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const product = await Product.findById(productId).populate(
      "category",
      "name slug",
    );

    if (!product || product.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Variants + their live stock.
    const variants = await ProductVariant.find({
      product: product._id,
      isActive: { $ne: false },
    }).lean();

    const variantsWithStock = await Promise.all(
      variants.map(async (v) => ({
        ...v,
        stock: await getAvailableStock(product._id, v._id),
      })),
    );

    // Base stock (non-variant products).
    const baseStock = await getAvailableStock(product._id, null);

    // Related products — same category (fallback: shared tags), excluding self.
    const relatedFilter: any = {
      _id: { $ne: product._id },
      isActive: { $ne: false },
    };
    if (product.category) {
      relatedFilter.category = product.category;
    } else if (product.tags && product.tags.length) {
      relatedFilter.tags = { $in: product.tags };
    }

    const related = await Product.find(relatedFilter)
      .limit(4)
      .select("productName productPrice productImages ratings");

    return res.status(200).json({
      success: true,
      data: {
        product,
        variants: variantsWithStock,
        stock: baseStock,
        related,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
