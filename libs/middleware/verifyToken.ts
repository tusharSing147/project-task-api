import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../config/jwt';

export function verifyTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
    const token =
        (req.headers['x-access-token'] as string | undefined) ||
        (req.cookies && req.cookies['x-access-token']);

    if (!token) {
        res.status(403).send({
            success: false,
            message: 'No token provided',
            data: [],
        });
        return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(401).send({
            success: false,
            message: 'Failed to authenticate token',
            data: [],
        });
        return;
    }

    req.id = decoded.id;
    req.role = decoded.role;
    next();
}
