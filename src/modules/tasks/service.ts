import mongoose from "mongoose";
import { Task } from "../../libs/config/schema";
import { HttpError } from "../../libs/helper/httpError";
import { validate } from "../../libs/helper/validator";
import { parsePagination } from "../../libs/helper/pagination";
import { assertProjectOwned } from "../../libs/helper/ownership";

const statuses = ["todo", "in_progress", "completed"];
const priorities = ["low", "medium", "high"];
const statusRule = `in:${statuses.join(",")}`;
const priorityRule = `in:${priorities.join(",")}`;
const projectIdRule = "integer|regex:/^[1-9]\\d*$/";
const validId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.isValidObjectId(id);

function withTrimmedTitle(body: Record<string, any>): Record<string, unknown> {
  return typeof body.title === "string"
    ? { ...body, title: body.title.trim() }
    : { ...body };
}

export async function create(userId: number, body: Record<string, any>) {
  const data = withTrimmedTitle(body);
  const v = validate(data, {
    title: "required|string|min:1|max:200",
    status: statusRule,
    priority: priorityRule,
    dueDate: "date|nullable",
    projectId: `required|${projectIdRule}`,
  });
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const { title, description, status, priority, dueDate, projectId } = body;
  const pid = Number(projectId);
  await assertProjectOwned(pid, userId);
  return Task.create({
    title: String(title).trim(),
    description: description == null ? "" : String(description),
    status: status ?? "todo",
    priority: priority ?? "medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    projectId: pid,
    userId,
  });
}

export async function list(userId: number, query: Record<string, any>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: any = { userId };
  const rules: Record<string, string> = {};
  if (query.status) rules.status = statusRule;
  if (query.priority) rules.priority = priorityRule;
  if (query.projectId) rules.projectId = projectIdRule;
  if (Object.keys(rules).length) {
    const v = validate(query, rules);
    if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  }
  if (query.status) filter.status = String(query.status);
  if (query.priority) filter.priority = String(query.priority);
  if (query.projectId) filter.projectId = Number(query.projectId);
  const [items, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
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
  const anyField =
    title !== undefined ||
    description !== undefined ||
    status !== undefined ||
    priority !== undefined ||
    dueDate !== undefined ||
    projectId !== undefined;
  if (!anyField) throw new HttpError(422, "No valid fields supplied");
  const rules: Record<string, string> = {};
  if (title !== undefined) rules.title = "string|min:1|max:200";
  if (status !== undefined) rules.status = statusRule;
  if (priority !== undefined) rules.priority = priorityRule;
  if (dueDate !== undefined) rules.dueDate = "date|nullable";
  if (projectId !== undefined) rules.projectId = projectIdRule;
  const v = validate(withTrimmedTitle(body), rules);
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const data: any = {};
  if (title !== undefined) data.title = String(title).trim();
  if (description !== undefined) data.description = String(description);
  if (status !== undefined) data.status = status;
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) {
    data.dueDate = dueDate === null ? null : new Date(dueDate);
  }
  if (projectId !== undefined) {
    const pid = Number(projectId);
    await assertProjectOwned(pid, userId);
    data.projectId = pid;
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
