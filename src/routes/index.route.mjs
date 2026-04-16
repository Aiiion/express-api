import { Router } from "express";
import weatherRouter from "./weather.route.mjs";
import infoRouter from "./info.route.mjs"
import authRouter from "./auth.route.mjs";
import logsRouter from "./logs.route.mjs";

const router = Router();

router.use(weatherRouter);
router.use(infoRouter);
router.use(authRouter);
router.use(logsRouter);

export default router;