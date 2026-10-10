import { Router } from 'express';
import * as controller from './controller';
import { verifyTokenMiddleware } from '../../../libs/middleware/verifyToken';

const router = Router();

router.use(verifyTokenMiddleware);

router.get('/', controller.listProjects);
router.post('/', controller.createProject);
router.get('/:id', controller.getProjectById);
router.put('/:id', controller.updateProject);
router.delete('/:id', controller.deleteProject);

export default router;
