import { Router } from "express";
import { AuthenticationController } from "@/controllers/AuthenticationController";

const authenticationRouter = Router();
const authenticationController = new AuthenticationController();

authenticationRouter.post("/", authenticationController.index);

export { authenticationRouter };
