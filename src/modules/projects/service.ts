import { Task } from "../../libs/config/schema";
import { prisma } from "../../libs/config/prismaClient";
import { HttpError } from "../../libs/helper/httpError";
import { validate } from "../../libs/helper/validator";
import { parsePagination } from "../../libs/helper/pagination";

const statuses = ["active", "completed", "archived"];
const statusRule = `in:${statuses.join(",")}`;

function positiveId(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function withTrimmedName(body: Record<string, any>): Record<string, unknown> {
  return typeof body.name === "string"
    ? { ...body, name: body.name.trim() }
    : { ...body };
}

export async function create(userId: number, body: Record<string, any>) {
  const data = withTrimmedName(body);
  const v = validate(data, {
    name: "required|string|min:2|max:150",
    status: statusRule,
  });
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const { name, description, status } = body;
  return prisma.project.create({
    data: {
      name: String(name).trim(),
      description: description == null ? null : String(description),
      status: status ?? "active",
      userId,
    },
  });
}

export async function list(userId: number, query: Record<string, any>) {
  const { page, limit, skip } = parsePagination(query);
  const where: any = { userId };
  if (query.status) {
    const v = validate(query, { status: statusRule });
    if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
    where.status = String(query.status);
  }
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
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
  if (name === undefined && description === undefined && status === undefined) {
    throw new HttpError(422, "No valid fields supplied");
  }
  const rules: Record<string, string> = {};
  if (name !== undefined) rules.name = "string|min:2|max:150";
  if (status !== undefined) rules.status = statusRule;
  const v = validate(withTrimmedName(body), rules);
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const data: any = {};
  if (name !== undefined) data.name = String(name).trim();
  if (description !== undefined)
    data.description = description === null ? null : String(description);
  if (status !== undefined) data.status = status;
  const exists = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (!exists) throw new HttpError(404, "Project not found");
  return prisma.project.update({ where: { id, userId }, data });
}

export async function remove(userId: number, rawId: unknown) {
  const id = positiveId(rawId);
  if (!id) throw new HttpError(400, "Invalid project ID");
  const project = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (!project) throw new HttpError(404, "Project not found");
  const taskCount = await Task.countDocuments({ projectId: id });
  if (taskCount > 0) {
    throw new HttpError(
      409,
      "Cannot delete project: it is already in use by tasks",
      { taskCount },
    );
  }
  await prisma.project.delete({ where: { id, userId } });
}
