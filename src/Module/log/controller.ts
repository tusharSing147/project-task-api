import { NextFunction, Request, Response } from 'express';
import { ActivityLog } from './model';
import { validate } from '../../../libs/helper/validator';

export async function listMyLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = { userId: req.id };
        if (req.query.entityType) filter.entityType = req.query.entityType;

        const [total, logs] = await Promise.all([
            ActivityLog.countDocuments(filter),
            ActivityLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        res.send({
            success: true,
            message: 'Success',
            data: logs,
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

export async function createLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { passed, errors } = validate(req.body, {
            action: 'required|string|min:2',
            entityType: 'required|string|min:2',
            entityId: 'nullable|string',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const { action, entityType, entityId, metadata } = req.body;

        const log = await ActivityLog.create({
            userId: req.id,
            action: String(action).trim(),
            entityType: String(entityType).trim(),
            entityId: entityId ? String(entityId) : undefined,
            metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
            ip: req.ip,
        });

        res.status(201).send({ success: true, message: 'Log recorded', data: log });
    } catch (error) {
        next(error);
    }
}
