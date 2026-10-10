import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../libs/config/prismaClient';
import { signToken } from '../../libs/config/jwt';
import { validate } from '../../libs/helper/validator';

const publicUser = (u: { id: number; name: string; email: string; createdAt: Date }) =>
  ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body ?? {};
    const v = validate(req.body ?? {}, { name: 'required|string|min:2|max:100', email: 'required|email', password: 'required|string|min:8' });
    if (!v.passed) { res.status(422).json({ success: false, message: 'Validation failed', data: v.errors }); return; }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      res.status(409).json({ success: false, message: 'Email already registered', data: null }); return;
    }
    const user = await prisma.user.create({ data: { name: String(name).trim(), email: normalizedEmail, password: await bcrypt.hash(String(password), 12) } });
    const token = signToken({ id: String(user.id), role: 'user' }, '7d');
    res.status(201).json({ success: true, message: 'Registration successful', data: { user: publicUser(user), token } });
  } catch (e) { next(e); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    const v = validate(req.body ?? {}, { email: 'required|email', password: 'required|string' });
    if (!v.passed) { res.status(422).json({ success: false, message: 'Validation failed', data: v.errors }); return; }
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password', data: null }); return;
    }
    const token = signToken({ id: String(user.id), role: 'user' }, '1d');
    res.json({ success: true, message: 'Login successful', data: { user: publicUser(user), token } });
  } catch (e) { next(e); }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.id) }, select: { id: true, name: true, email: true, createdAt: true } });
    if (!user) { res.status(404).json({ success: false, message: 'User not found', data: null }); return; }
    res.json({ success: true, message: 'Success', data: user });
  } catch (e) { next(e); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body ?? {};
    const rules: Record<string, string> = {};
    if (name !== undefined) rules.name = 'string|min:2|max:100';
    if (email !== undefined) rules.email = 'email';
    if (password !== undefined) rules.password = 'string|min:8';
    if (!Object.keys(rules).length) { res.status(422).json({ success: false, message: 'Provide name, email, or password to update', data: null }); return; }
    const v = validate(req.body, rules);
    if (!v.passed) { res.status(422).json({ success: false, message: 'Validation failed', data: v.errors }); return; }
    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (email !== undefined) data.email = String(email).trim().toLowerCase();
    if (password !== undefined) data.password = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.update({ where: { id: Number(req.id) }, data, select: { id: true, name: true, email: true, createdAt: true } });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (e) { next(e); }
}
