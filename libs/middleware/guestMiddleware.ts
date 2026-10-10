import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../config/jwt';

export function guestMiddleware(req: Request, res: Response, next: NextFunction): void {
    const token =
        (req.headers['x-access-token'] as string | undefined) ||
        (req.cookies && req.cookies['x-access-token']);

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.id = decoded.id;
            req.role = decoded.role;
        }
    }

    next();
}
