import { Router } from "express";
import { AuthenticationController } from "@/controllers/AuthenticationController";

const authenticationRouter = Router();
const authenticationController = new AuthenticationController();

// Registrar novo usuário
authenticationRouter.post("/registrar", authenticationController.register);

// Login
authenticationRouter.post("/", authenticationController.index);

export { authenticationRouter };
