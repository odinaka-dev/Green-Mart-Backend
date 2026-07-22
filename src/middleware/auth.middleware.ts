import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * protect — Express middleware that requires a valid user JWT.
 * Rejects guest tokens (type: "guest") — use verifyToken if you want
 * to allow both user and guest access on the same route.
 */
const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Explicitly reject guest tokens — this middleware is user-only
    if (decoded.type === "guest") {
      return res.status(403).json({
        success: false,
        message: "Guest tokens are not permitted on this route",
      });
    }

    (req as any).user = decoded;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

export default protect;
