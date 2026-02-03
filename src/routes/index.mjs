import { Router } from "express";
import apiRouter from "./api.mjs";
import infoRouter from "./info.mjs"
import queueRouter from "./queue.mjs";

const router = Router();

router.use(apiRouter);
router.use(infoRouter);
router.use('/queue', queueRouter);

export default router;