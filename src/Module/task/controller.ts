import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../libs/config/prismaClient';
import { validate } from '../../../libs/helper/validator';

async function canAccessProject(projectId: number, userId: number): Promise<boolean> {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
            ],
        },
    });
    return !!project;
}

export async function listTasksByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const projectId = Number(req.params.projectId);
        const userId = Number(req.id);

        if (!(await canAccessProject(projectId, userId))) {
            res.status(403).send({ success: false, message: 'Forbidden', data: [] });
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const where = { projectId };
        const status = req.query.status as string | undefined;
        const finalWhere = status ? { ...where, status: status as any } : where;

        const [total, tasks] = await prisma.$transaction([
            prisma.task.count({ where: finalWhere }),
            prisma.task.findMany({
                where: finalWhere,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    creator: { select: { id: true, name: true } },
                },
            }),
        ]);

        res.send({
            success: true,
            message: 'Success',
            data: tasks,
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

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const projectId = Number(req.params.projectId);
        const userId = Number(req.id);

        const { passed, errors } = validate(req.body, {
            title: 'required|string|min:2',
            description: 'nullable|string|max:2000',
            status: 'nullable|in:TODO,IN_PROGRESS,DONE',
            priority: 'nullable|in:LOW,MEDIUM,HIGH',
            dueDate: 'nullable|date',
            assigneeId: 'nullable|integer',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        if (!(await canAccessProject(projectId, userId))) {
            res.status(403).send({ success: false, message: 'Forbidden', data: [] });
            return;
        }

        const { title, description, status, priority, dueDate, assigneeId } = req.body;

        const task = await prisma.task.create({
            data: {
                title: String(title).trim(),
                description: description ? String(description).trim() : null,
                status: (status as any) || 'TODO',
                priority: (priority as any) || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId,
                creatorId: userId,
                assigneeId: assigneeId ? Number(assigneeId) : null,
            },
        });

        res.status(201).send({ success: true, message: 'Task created', data: task });
    } catch (error) {
        next(error);
    }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const taskId = Number(req.params.id);
        const userId = Number(req.id);

        const { passed, errors } = validate(req.body, {
            title: 'required|string|min:2',
            description: 'nullable|string|max:2000',
            status: 'nullable|in:TODO,IN_PROGRESS,DONE',
            priority: 'nullable|in:LOW,MEDIUM,HIGH',
            dueDate: 'nullable|date',
            assigneeId: 'nullable|integer',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const existing = await prisma.task.findFirst({
            where: { id: taskId },
            include: { project: { select: { id: true, ownerId: true } } },
        });

        if (!existing) {
            res.status(404).send({ success: false, message: 'Task not found', data: [] });
            return;
        }

        if (existing.project.ownerId !== userId && existing.creatorId !== userId && existing.assigneeId !== userId) {
            res.status(403).send({ success: false, message: 'Forbidden', data: [] });
            return;
        }

        const { title, description, status, priority, dueDate, assigneeId } = req.body;

        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: String(title).trim(),
                description: description ? String(description).trim() : null,
                status: (status as any) || undefined,
                priority: (priority as any) || undefined,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
                assigneeId: assigneeId !== undefined ? (assigneeId ? Number(assigneeId) : null) : undefined,
            },
        });

        res.send({ success: true, message: 'Task updated', data: task });
    } catch (error) {
        next(error);
    }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const taskId = Number(req.params.id);
        const userId = Number(req.id);

        const existing = await prisma.task.findFirst({
            where: { id: taskId },
            include: { project: { select: { id: true, ownerId: true } } },
        });

        if (!existing) {
            res.status(404).send({ success: false, message: 'Task not found', data: [] });
            return;
        }

        if (existing.project.ownerId !== userId && existing.creatorId !== userId) {
            res.status(403).send({ success: false, message: 'Forbidden', data: [] });
            return;
        }

        await prisma.task.delete({ where: { id: taskId } });

        res.send({ success: true, message: 'Task deleted', data: [] });
    } catch (error) {
        next(error);
    }
}
