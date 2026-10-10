import { NextFunction, Request, Response } from "express";
import * as service from "./service";

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.getStats(Number(req.id));
    res.json({
      success: true,
      message: "Dashboard statistics retrieved",
      data,
    });
  } catch (e) {
    next(e);
  }
}
