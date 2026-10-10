import createError from 'http-errors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import * as swagger from './libs/config/swagger';
import { prisma } from './libs/config/prismaClient';
import { isMongoConnected } from './libs/config/mongoose';

dotenv.config();

const app = express();

app.use(
    fileUpload({
        createParentPath: true,
    })
);

app.use(cors());

app.use(cookieParser());

app.use(
    session({
        secret: process.env.JWT_SECRET || '123',
        resave: false,
        saveUninitialized: false,
    })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));

import authRoutes from './src/Module/auth/route';

app.use('/api/v1/auth', authRoutes);

app.get('/health', async (req: Request, res: Response) => {
    let mysql = false;
    try {
        await prisma.$queryRaw`SELECT 1`;
        mysql = true;
    } catch {
        mysql = false;
    }

    const mongo = isMongoConnected() && mongoose.connection.readyState === 1;

    res.status(mysql && mongo ? 200 : 503).send({
        success: mysql && mongo,
        message: mysql && mongo ? 'API is healthy' : 'One or more databases are unreachable',
        data: {
            mysql: mysql ? 'up' : 'down',
            mongo: mongo ? 'up' : 'down',
        },
    });
});

swagger.swaggerSetup(app);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    res.status(err.status || 500);
    res.send({
        success: false,
        message: err.status === 404 ? 'API Not Found' : 'Internal Server Error',
        data: [],
        error: req.app.get('env') === 'development' ? err.message : undefined,
    });
});

export default app;
