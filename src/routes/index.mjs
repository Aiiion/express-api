import { Router } from "express";
import apiRouter from "./api.mjs";
import infoRouter from "./info.mjs"
import authRouter from "./auth.mjs";

const router = Router();

router.use(apiRouter);
router.use(infoRouter);
router.use(authRouter);

export default router;