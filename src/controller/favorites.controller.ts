import mongoose from "mongoose";
import Favorite from "../model/favorites.model";

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
