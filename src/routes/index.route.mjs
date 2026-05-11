import { Router } from "express";
import weatherRouter from "./weather.route.mjs";
import infoRouter from "./info.route.mjs"
import authRouter from "./auth.route.mjs";
import logsRouter from "./requestLogs.route.mjs";
import v1Router from "./v1.route.mjs";

const router = Router();

router.use(weatherRouter);
router.use(infoRouter);
router.use(authRouter);
router.use(logsRouter);
router.use(v1Router);

router.use((req, res) => {
    res.status(404).json({ code: 404, message: 'Not Found' });
});

export default router;