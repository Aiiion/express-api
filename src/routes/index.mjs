import { Router } from "express";
import weatherRouter from "./weather.mjs";
import infoRouter from "./info.mjs"
import authRouter from "./auth.mjs";

const router = Router();

router.use(weatherRouter);
router.use(infoRouter);
router.use(authRouter);

export default router;