import { Router } from 'express';
import * as controller from './controller';
import { verifyTokenMiddleware } from '../../../libs/middleware/verifyToken';

const router = Router();

router.use(verifyTokenMiddleware);

router.get('/', controller.listMyNotifications);
router.post('/', controller.createNotification);
router.patch('/:id/read', controller.markAsRead);

export default router;
