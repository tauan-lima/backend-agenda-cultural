import { Router } from "express";
import { authenticationRouter } from "./authenticationRouter";

const router = Router();

router.use("/entrar", authenticationRouter);

export { router };
