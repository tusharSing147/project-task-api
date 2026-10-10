import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
    id: string;
    role: string;
    expiresIn?: string;
}

export function signToken(payload: JwtPayload): string {
    const options: jwt.SignOptions = {};
    if (payload.expiresIn) {
        options.expiresIn = payload.expiresIn as jwt.SignOptions['expiresIn'];
    }
    return jwt.sign({ id: payload.id, role: payload.role }, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}
