import { Request, Response } from "express";
import Product from "../model/product.model";
import cloudinary from "../config/cloudinary";
import Favorite from "../model/favorites.model";
import mongoose from "mongoose";

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

    const product = await Product.create({
      ...req.body,
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

// controllers to get all products
export const getProductsController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "newest";
    // const minPrice = Number(req.query.minPrice) || 0;
    // const maxPrice = Number(req.query.maxPrice) || 100000000;

    const skip = (page - 1) * limit;

    // const filter: any = {
    //   productPrice: {
    //     $gte: minPrice,
    //     $lte: maxPrice,
    //   },
    // };

    const filter: any = {};

    if (search) {
      filter.productName = {
        $regex: search,
        $options: "i",
      };
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

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Product.countDocuments(filter);

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

// get favorites products, Delete favorite producrs, post favorite products (post by id)
export const addFavorite = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    const favorite = await Favorite.create({
      userId,
      productId,
    });

    return res.status(201).json({
      success: true,
      message: "Addedd to favorites",
      favorite,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getFavorites = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const favorites = await Favorite.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const removeFavorites = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const deleted = await Favorite.findOneAndDelete({
      userId: new mongoose.Types.ObjectId(userId), // ← cast this too
      productId: new mongoose.Types.ObjectId(productId),
    });

    return res.status(200).json({
      success: true,
      message: "Favorite Removed successfully",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// export const addFavorite = async (req: any, res: any) => {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.user.id);
//     const { productId } = req.body;

//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "productId is required",
//       });
//     }

//     const existing = await Favorite.findOne({
//       userId,
//       productId: new mongoose.Types.ObjectId(productId as string),
//     });

//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "Product already in favorites",
//       });
//     }

//     const favorite = await Favorite.create({
//       userId,
//       productId: new mongoose.Types.ObjectId(productId as string),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Added to favorites",
//       data: favorite,
//     });
//   } catch (err: any) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// export const getFavorites = async (req: any, res: any) => {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.user.id as string);

//     const favorites = await Favorite.find({ userId })
//       .populate("productId")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       data: favorites,
//     });
//   } catch (err: any) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// export const removeFavorite = async (req: any, res: any) => {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.user.id as string);
//     const { productId } = req.params;

//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "productId is required",
//       });
//     }

//     const deleted = await Favorite.findOneAndDelete({
//       userId,
//       productId: new mongoose.Types.ObjectId(productId as string),
//     });

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Favorite not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Favorite removed successfully",
//     });
//   } catch (err: any) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
