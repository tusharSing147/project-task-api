import { Router } from 'express';
import * as controller from './controller';
import { verifyTokenMiddleware } from '../../../libs/middleware/verifyToken';

const router = Router();

router.use(verifyTokenMiddleware);

router.get('/project/:projectId', controller.listTasksByProject);
router.post('/project/:projectId', controller.createTask);
router.put('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);

export default router;
