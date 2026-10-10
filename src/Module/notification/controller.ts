import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from './model';
import { validate } from '../../../libs/helper/validator';

export async function listMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = { userId: req.id };
        if (req.query.unread === 'true') filter.read = false;

        const [total, notifications] = await Promise.all([
            Notification.countDocuments(filter),
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        res.send({
            success: true,
            message: 'Success',
            data: notifications,
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

export async function createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { passed, errors } = validate(req.body, {
            title: 'required|string|min:2',
            message: 'required|string|min:2',
            type: 'nullable|in:INFO,WARNING,SUCCESS,ERROR',
            entityType: 'nullable|string',
            entityId: 'nullable|string',
        });

        if (!passed) {
            res.status(422).send({ success: false, message: 'Validation failed', data: errors });
            return;
        }

        const { title, message, type, entityType, entityId } = req.body;

        const notification = await Notification.create({
            userId: req.id,
            title: String(title).trim(),
            message: String(message).trim(),
            type: type || 'INFO',
            entityType: entityType ? String(entityType) : undefined,
            entityId: entityId ? String(entityId) : undefined,
        });

        res.status(201).send({ success: true, message: 'Notification created', data: notification });
    } catch (error) {
        next(error);
    }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = String(req.params.id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(422).send({ success: false, message: 'Invalid notification id', data: [] });
            return;
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).send({ success: false, message: 'Notification not found', data: [] });
            return;
        }

        res.send({ success: true, message: 'Notification marked as read', data: notification });
    } catch (error) {
        next(error);
    }
}
