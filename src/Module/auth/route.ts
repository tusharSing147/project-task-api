import { Router } from 'express';
import * as controller from './controller';
import { verifyTokenMiddleware } from '../../../libs/middleware/verifyToken';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', verifyTokenMiddleware, controller.getMe);

export default router;
