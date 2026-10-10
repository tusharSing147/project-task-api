import bcrypt from "bcryptjs";
import { prisma } from "../../libs/config/prismaClient";
import { signToken } from "../../libs/config/jwt";
import { validate } from "../../libs/helper/validator";
import { HttpError } from "../../libs/helper/httpError";

const publicUser = (u: {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

export async function register(body: Record<string, any>) {
  const { name, email, password } = body;
  const v = validate(body, {
    name: "required|string|min:2|max:100",
    email: "required|email",
    password: "required|string|min:8",
  });
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const normalizedEmail = String(email).trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
    throw new HttpError(409, "Email already registered");
  }
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(String(password), 12),
    },
  });
  const token = signToken({ id: String(user.id), role: "user" }, "7d");
  return { user: publicUser(user), token };
}

export async function login(body: Record<string, any>) {
  const { email, password } = body;
  const v = validate(body, {
    email: "required|email",
    password: "required|string",
  });
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    throw new HttpError(401, "Invalid email or password");
  }
  const token = signToken({ id: String(user.id), role: "user" }, "1d");
  return { user: publicUser(user), token };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

export async function updateProfile(userId: number, body: Record<string, any>) {
  const { name, email, password } = body;
  const rules: Record<string, string> = {};
  if (name !== undefined) rules.name = "string|min:2|max:100";
  if (email !== undefined) rules.email = "email";
  if (password !== undefined) rules.password = "string|min:8";
  if (!Object.keys(rules).length) {
    throw new HttpError(422, "Provide name, email, or password to update");
  }
  const v = validate(body, rules);
  if (!v.passed) throw new HttpError(422, "Validation failed", v.errors);
  const data: any = {};
  if (name !== undefined) data.name = String(name).trim();
  if (email !== undefined) data.email = String(email).trim().toLowerCase();
  if (password !== undefined)
    data.password = await bcrypt.hash(String(password), 12);
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, createdAt: true },
  });
}
