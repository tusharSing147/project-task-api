import { NextFunction, Request, Response } from "express";
import * as service from "./service";

const uid = (req: Request) => Number(req.id);

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await service.create(uid(req), req.body ?? {});
    res
      .status(201)
      .json({ success: true, message: "Project created", data: project });
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
    res.json({ success: true, message: "Projects retrieved", data });
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
    const project = await service.getById(uid(req), req.params.id);
    res.json({ success: true, message: "Project retrieved", data: project });
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
    const project = await service.update(
      uid(req),
      req.params.id,
      req.body ?? {},
    );
    res.json({ success: true, message: "Project updated", data: project });
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
    res.json({ success: true, message: "Project deleted", data: null });
  } catch (e) {
    next(e);
  }
}
