import { Router } from "express";
import apiRouter from "./api.mjs";

const router = Router();

router.use(apiRouter);

export default router;