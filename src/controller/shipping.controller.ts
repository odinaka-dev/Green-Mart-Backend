import { Request, Response } from "express";
import mongoose from "mongoose";
import ShippingMethod from "../model/shippingMethod.model";

// ─── Public: list active shipping methods ─────────────────────────────────────
export const listShippingMethods = async (_req: Request, res: Response) => {
  try {
    const methods = await ShippingMethod.find({ isActive: { $ne: false } }).sort({
      fee: 1,
    });
    return res.status(200).json({ success: true, data: methods });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: create shipping method ────────────────────────────────────────────
export const createShippingMethod = async (req: Request, res: Response) => {
  try {
    const { name, description, fee, estimatedDays, regions } = req.body;
    if (!name || fee === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "name and fee are required" });
    }
    const method = await ShippingMethod.create({
      name,
      description,
      fee: Number(fee),
      estimatedDays,
      regions: Array.isArray(regions) ? regions : [],
    });
    return res.status(201).json({ success: true, data: method });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: update shipping method ────────────────────────────────────────────
export const updateShippingMethod = async (req: Request, res: Response) => {
  try {
    const methodId = req.params.methodId as string;
    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({ success: false, message: "Invalid method id" });
    }
    const method = await ShippingMethod.findByIdAndUpdate(methodId, req.body, {
      new: true,
    });
    if (!method) {
      return res.status(404).json({ success: false, message: "Shipping method not found" });
    }
    return res.status(200).json({ success: true, data: method });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: delete shipping method ────────────────────────────────────────────
export const deleteShippingMethod = async (req: Request, res: Response) => {
  try {
    const methodId = req.params.methodId as string;
    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({ success: false, message: "Invalid method id" });
    }
    await ShippingMethod.findByIdAndDelete(methodId);
    return res.status(200).json({ success: true, message: "Shipping method deleted" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
