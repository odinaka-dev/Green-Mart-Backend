import { Request, Response } from "express";
import { adminLoginService, createAdminService } from "../services/admin.service";

export const createAdminController = async (req: Request, res: Response) => {
  const result = await createAdminService(req.body);

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    data: result,
  });
};

export const adminLoginController = async (req: Request, res: Response) => {
  const result = await adminLoginService(req.body);

  res.status(200).json({
    success: true,
    message: "Admin login successful",
    data: result,
  });
};

export const adminLogoutController = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
};
