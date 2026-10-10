import { prisma } from "../../libs/config/prismaClient";
import { HttpError } from "../../libs/helper/httpError";

const statuses = ["active", "completed", "archived"];

function positiveId(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export async function create(userId: number, body: Record<string, any>) {
  const { name, description, status } = body;
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 150
  ) {
    throw new HttpError(422, "name must be 2–150 characters");
  }
  if (status !== undefined && !statuses.includes(status)) {
    throw new HttpError(422, "Invalid project status", statuses);
  }
  return prisma.project.create({
    data: {
      name: name.trim(),
      description: description == null ? null : String(description),
      status: status ?? "active",
      userId,
    },
  });
}

export async function list(userId: number, query: Record<string, any>) {
  const page = Math.max(1, Number(query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const where: any = { userId };
  if (query.status) {
    if (!statuses.includes(String(query.status))) {
      throw new HttpError(422, "Invalid status", statuses);
    }
    where.status = String(query.status);
  }
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);
  return {
    items: projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(userId: number, rawId: unknown) {
  const id = positiveId(rawId);
  if (!id) throw new HttpError(400, "Invalid project ID");
  const project = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (!project) throw new HttpError(404, "Project not found");
  return project;
}

export async function update(
  userId: number,
  rawId: unknown,
  body: Record<string, any>,
) {
  const id = positiveId(rawId);
  if (!id) throw new HttpError(400, "Invalid project ID");
  const { name, description, status } = body;
  const data: any = {};
  if (name !== undefined) {
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 150
    ) {
      throw new HttpError(422, "name must be 2–150 characters");
    }
    data.name = name.trim();
  }
  if (description !== undefined)
    data.description = description === null ? null : String(description);
  if (status !== undefined) {
    if (!statuses.includes(status)) {
      throw new HttpError(422, "Invalid project status", statuses);
    }
    data.status = status;
  }
  if (!Object.keys(data).length) {
    throw new HttpError(422, "No valid fields supplied");
  }
  const exists = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (!exists) throw new HttpError(404, "Project not found");
  return prisma.project.update({ where: { id }, data });
}

export async function remove(userId: number, rawId: unknown) {
  const id = positiveId(rawId);
  if (!id) throw new HttpError(400, "Invalid project ID");
  const project = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (!project) throw new HttpError(404, "Project not found");
  await prisma.project.delete({ where: { id } });
}
