import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../config/jwt";
export function verifyTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token =
    (header?.startsWith("Bearer ") ? header.slice(7) : undefined) ||
    (req.headers["x-access-token"] as string | undefined) ||
    req.cookies?.["x-access-token"];
  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required", data: null });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      data: null,
    });
    return;
  }
  req.id = decoded.id;
  req.role = decoded.role;
  next();
}
