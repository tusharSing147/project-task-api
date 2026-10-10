import mongoose from "mongoose";
import { Task } from "../../libs/config/schema";
import { prisma } from "../../libs/config/prismaClient";
import { HttpError } from "../../libs/helper/httpError";

const statuses = ["todo", "in_progress", "completed"];
const priorities = ["low", "medium", "high"];
const validId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.isValidObjectId(id);

export async function create(userId: number, body: Record<string, any>) {
  const { title, description, status, priority, dueDate, projectId } = body;
  if (
    typeof title !== "string" ||
    title.trim().length < 1 ||
    title.trim().length > 200
  ) {
    throw new HttpError(422, "title is required (1–200 characters)");
  }
  if (status !== undefined && !statuses.includes(status)) {
    throw new HttpError(422, "Invalid status", statuses);
  }
  if (priority !== undefined && !priorities.includes(priority)) {
    throw new HttpError(422, "Invalid priority", priorities);
  }
  const pid = Number(projectId);
  if (!Number.isSafeInteger(pid) || pid < 1) {
    throw new HttpError(422, "Valid projectId is required");
  }
  const project = await prisma.project.findFirst({
    where: { id: pid, userId },
  });
  if (!project) {
    throw new HttpError(404, "Project not found or not owned by user");
  }
  return Task.create({
    title: title.trim(),
    description: description == null ? "" : String(description),
    status: status ?? "todo",
    priority: priority ?? "medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    projectId: pid,
    userId,
  });
}

export async function list(userId: number, query: Record<string, any>) {
  const page = Math.max(1, Number(query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const filter: any = { userId };
  if (query.status) {
    if (!statuses.includes(String(query.status))) {
      throw new HttpError(422, "Invalid status", statuses);
    }
    filter.status = String(query.status);
  }
  if (query.priority) {
    if (!priorities.includes(String(query.priority))) {
      throw new HttpError(422, "Invalid priority", priorities);
    }
    filter.priority = String(query.priority);
  }
  if (query.projectId) {
    const pid = Number(query.projectId);
    if (!Number.isSafeInteger(pid) || pid < 1) {
      throw new HttpError(422, "Invalid projectId");
    }
    filter.projectId = pid;
  }
  const [items, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(userId: number, id: unknown) {
  if (!validId(id)) throw new HttpError(400, "Invalid task ID");
  const task = await Task.findOne({ _id: id, userId }).lean();
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

export async function update(
  userId: number,
  id: unknown,
  body: Record<string, any>,
) {
  if (!validId(id)) throw new HttpError(400, "Invalid task ID");
  const { title, description, status, priority, dueDate, projectId } = body;
  const data: any = {};
  if (title !== undefined) {
    if (
      typeof title !== "string" ||
      title.trim().length < 1 ||
      title.trim().length > 200
    ) {
      throw new HttpError(422, "Invalid title");
    }
    data.title = title.trim();
  }
  if (description !== undefined) data.description = String(description);
  if (status !== undefined) {
    if (!statuses.includes(status)) {
      throw new HttpError(422, "Invalid status", statuses);
    }
    data.status = status;
  }
  if (priority !== undefined) {
    if (!priorities.includes(priority)) {
      throw new HttpError(422, "Invalid priority", priorities);
    }
    data.priority = priority;
  }
  if (dueDate !== undefined) {
    const date = dueDate === null ? null : new Date(dueDate);
    if (date && Number.isNaN(date.getTime())) {
      throw new HttpError(422, "Invalid dueDate");
    }
    data.dueDate = date;
  }
  if (projectId !== undefined) {
    const pid = Number(projectId);
    if (!Number.isSafeInteger(pid) || pid < 1) {
      throw new HttpError(422, "Invalid projectId");
    }
    const project = await prisma.project.findFirst({
      where: { id: pid, userId },
    });
    if (!project) {
      throw new HttpError(404, "Project not found or not owned by user");
    }
    data.projectId = pid;
  }
  if (!Object.keys(data).length) {
    throw new HttpError(422, "No valid fields supplied");
  }
  const task = await Task.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true, runValidators: true },
  );
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

export async function remove(userId: number, id: unknown) {
  if (!validId(id)) throw new HttpError(400, "Invalid task ID");
  const task = await Task.findOneAndDelete({ _id: id, userId });
  if (!task) throw new HttpError(404, "Task not found");
}
