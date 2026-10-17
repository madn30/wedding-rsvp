import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { Admin } from "../models/Admin";
import { AppError } from "../utils/helpers";

export interface AuthRequest extends Request {
  admin?: { id: string; email: string };
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError("No token provided. Access denied.", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return next(new AppError("Admin account not found.", 401));
    }

    req.admin = { id: String(admin._id), email: admin.email };
    next();
  } catch {
    next(new AppError("Invalid or expired token.", 401));
  }
};
