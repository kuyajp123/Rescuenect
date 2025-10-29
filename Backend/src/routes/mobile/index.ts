import { Router } from "express";
import authRoutes from "./auth";
import statusRoutes from "./status";
import userDataRoutes from "./userData";
import geoCodingRoutes from "./geoCoding";

const mobileRouter = Router();

mobileRouter.use('/auth', authRoutes);

mobileRouter.use('/status', statusRoutes);

mobileRouter.use('/userData', userDataRoutes);

mobileRouter.use('/api', geoCodingRoutes);

export default mobileRouter;
