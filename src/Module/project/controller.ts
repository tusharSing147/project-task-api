import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../libs/config/prismaClient';
import { validate } from '../../../libs/helper/validator';

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const where = { ownerId: Number(req.id) };

        const [total, projects] = await prisma.$transaction([
            prisma.project.count({ where }),
            prisma.project.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { _count: { select: { tasks: true, members: true } } },
            }),
        ]);

        res.send({
            success: true,
            message: 'Success',
            data: projects,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const project = await prisma.project.findFirst({
            where: { id: Number(req.params.id) },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                tasks: { orderBy: { createdAt: 'desc' } },
                _count: { select: { members: true } },
            },
        });

        if (!project) {
            res.status(404).send({ success: false, message: 'Project not found', data: [] });
            return;
        }

        res.send({ success: true, message: 'Success', data: project });
    } catch (error) {
        next(error);
    }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, description } = req.body;

        const { passed, errors } = validate(req.body, {
            name: 'required|string|min:2',
            description: 'nullable|string|max:1000',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const project = await prisma.project.create({
            data: {
                name: String(name).trim(),
                description: description ? String(description).trim() : null,
                ownerId: Number(req.id),
            },
        });

        res.status(201).send({ success: true, message: 'Project created', data: project });
    } catch (error) {
        next(error);
    }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, description } = req.body;

        const { passed, errors } = validate(req.body, {
            name: 'required|string|min:2',
            description: 'nullable|string|max:1000',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const existing = await prisma.project.findFirst({ where: { id: Number(req.params.id) } });
        if (!existing) {
            res.status(404).send({ success: false, message: 'Project not found', data: [] });
            return;
        }

        if (existing.ownerId !== Number(req.id)) {
            res.status(403).send({ success: false, message: 'Forbidden', data: [] });
            return;
        }

        const project = await prisma.project.update({
            where: { id: existing.id },
            data: {
                name: String(name).trim(),
                description: description ? String(description).trim() : null,
            },
        });

        res.send({ success: true, message: 'Project updated', data: project });
    } catch (error) {
        next(error);
    }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const existing = await prisma.project.findFirst({ where: { id: Number(req.params.id) } });
        if (!existing) {
            res.status(404).send({ success: false, message: 'Project not found', data: [] });
            return;
        }

        if (existing.ownerId !== Number(req.id)) {
            res.status(403).send({ success: false, message: 'Forbidden', data: [] });
            return;
        }

        await prisma.project.delete({ where: { id: existing.id } });

        res.send({ success: true, message: 'Project deleted', data: [] });
    } catch (error) {
        next(error);
    }
}
