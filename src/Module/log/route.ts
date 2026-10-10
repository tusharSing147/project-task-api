import { Router } from 'express';
import * as controller from './controller';
import { verifyTokenMiddleware } from '../../../libs/middleware/verifyToken';

const router = Router();

router.use(verifyTokenMiddleware);

router.get('/', controller.listMyLogs);
router.post('/', controller.createLog);

export default router;
