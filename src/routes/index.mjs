import { Router } from "express";
import apiRouter from "./api.mjs";
import infoRouter from "./info.mjs"

const router = Router();

router.use(apiRouter);
router.use(infoRouter);

export default router;