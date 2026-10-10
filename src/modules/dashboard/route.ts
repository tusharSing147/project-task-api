import { Router } from "express";
import { getDashboard } from "./controller";
import { verifyTokenMiddleware } from "../../libs/middleware/verifyToken";
const router = Router();
router.get("/", verifyTokenMiddleware, getDashboard);
export default router;
