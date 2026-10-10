import { NextFunction, Request, Response } from "express";
import * as service from "./service";

const uid = (req: Request) => Number(req.id);

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const task = await service.create(uid(req), req.body ?? {});
    res
      .status(201)
      .json({ success: true, message: "Task created", data: task });
  } catch (e) {
    next(e);
  }
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.list(uid(req), req.query);
    res.json({ success: true, message: "Tasks retrieved", data });
  } catch (e) {
    next(e);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const task = await service.getById(uid(req), req.params.id);
    res.json({ success: true, message: "Task retrieved", data: task });
  } catch (e) {
    next(e);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const task = await service.update(uid(req), req.params.id, req.body ?? {});
    res.json({ success: true, message: "Task updated", data: task });
  } catch (e) {
    next(e);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.remove(uid(req), req.params.id);
    res.json({ success: true, message: "Task deleted", data: null });
  } catch (e) {
    next(e);
  }
}
