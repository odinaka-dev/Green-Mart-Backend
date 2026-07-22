import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../model/user.model";

export const protectAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.type === "guest") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
