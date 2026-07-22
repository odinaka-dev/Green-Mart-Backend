import { Request, Response } from "express";
import Product from "../model/product.model";
import cloudinary from "../config/cloudinary";
import Favorite from "../model/favorites.model";
import mongoose from "mongoose";

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

    const { sizes, tags, availableColors, ...rest } = req.body;

    const product = await Product.create({
      ...rest,
      sizes: parseArrayField(sizes),
      tags: parseArrayField(tags),
      availableColors: parseArrayField(availableColors),
      productImages: uploadedImages,
    });

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

// UPDATE PRODUCT BY ID
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

    const { sizes, tags, availableColors, ...rest } = req.body;

    const allowedFields = [
      "productName",
      "productDescription",
      "productPrice",
      "ratings",
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

// controllers to get all products
export const getProductsController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "newest";
    const collections = (req.query.collections as string) || "";
    const color = (req.query.color as string) || "";

    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    // ?collections=male  →  products where tags array contains "male"
    if (collections) {
      filter.tags = { $in: collections.split(",").map((t) => t.trim().toLowerCase()) };
    }

    // ?color=red  →  products where availableColors array contains "red"
    if (color) {
      filter.availableColors = { $in: color.split(",").map((c) => c.trim().toLowerCase()) };
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
      Product.find(filter).sort(sortOption).skip(skip).limit(limit).select("-__v"),
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

// GET PRODUCT BY ID
export const getSingleProduct = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const productDetails = await Product.find({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (!productDetails) {
      res.status(204).json({
        success: true,
        status: 204,
        message: "No product found",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      data: productDetails,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message,
    });
  }
};
