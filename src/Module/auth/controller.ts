import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../libs/config/prismaClient';
import { signToken } from '../../../libs/config/jwt';
import { validate } from '../../../libs/helper/validator';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, email, password } = req.body;

        const { passed, errors } = validate(req.body, {
            name: 'required|string|min:2',
            email: 'required|email',
            password: 'required|string|min:8',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            res.status(409).send({ success: false, message: 'Email already registered', data: [] });
            return;
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: String(name).trim(),
                email: normalizedEmail,
                password: hashed,
            },
        });

        const token = signToken({ id: String(user.id), role: user.role, expiresIn: '7d' });

        res.status(201).send({
            success: true,
            message: 'Registration successful',
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;

        const { passed, errors } = validate(req.body, {
            email: 'required|email',
            password: 'required|string',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            res.status(401).send({ success: false, message: 'Invalid credentials', data: [] });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(401).send({ success: false, message: 'Invalid credentials', data: [] });
            return;
        }

        const token = signToken({ id: String(user.id), role: user.role, expiresIn: '24h' });

        res.send({
            success: true,
            message: 'Login successful',
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(req.id) },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        if (!user) {
            res.status(404).send({ success: false, message: 'User not found', data: [] });
            return;
        }

        res.send({ success: true, message: 'Success', data: user });
    } catch (error) {
        next(error);
    }
}
