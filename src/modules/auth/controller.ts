import { NextFunction, Request, Response } from "express";
import * as service from "./service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.register(req.body ?? {});
    res
      .status(201)
      .json({ success: true, message: "Registration successful", data });
  } catch (e) {
    next(e);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.login(req.body ?? {});
    res.json({ success: true, message: "Login successful", data });
  } catch (e) {
    next(e);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await service.getMe(Number(req.id));
    res.json({ success: true, message: "Success", data: user });
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await service.updateProfile(Number(req.id), req.body ?? {});
    res.json({ success: true, message: "Profile updated", data: user });
  } catch (e) {
    next(e);
  }
}
