import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../model/category.model";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ─── Public: list categories ──────────────────────────────────────────────────
export const listCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: { $ne: false } }).sort({
      name: 1,
    });
    return res.status(200).json({ success: true, data: categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: create category ───────────────────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const slug = slugify(name);
    const exists = await Category.findOne({ $or: [{ name }, { slug }] });
    if (exists) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({ name, slug, description });
    return res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: update category ───────────────────────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const { name, description, isActive } = req.body;
    const update: any = {};
    if (name !== undefined) {
      update.name = name;
      update.slug = slugify(name);
    }
    if (description !== undefined) update.description = description;
    if (isActive !== undefined) update.isActive = isActive;

    const category = await Category.findByIdAndUpdate(categoryId, update, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({ success: true, data: category });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
