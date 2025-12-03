import { Router } from "express";
import { SavedEventController } from "@/controllers/SavedEventController";
import { authenticationHandler } from "@/middlewares/AuthenticationHandler";

const savedEventRouter = Router();
const savedEventController = new SavedEventController();

// Salvar evento (usuário autenticado)
savedEventRouter.post("/", authenticationHandler, savedEventController.create);

// Remover evento salvo (usuário autenticado)
savedEventRouter.delete("/:eventId", authenticationHandler, savedEventController.delete);

// Listar eventos salvos (usuário autenticado)
savedEventRouter.get("/", authenticationHandler, savedEventController.index);

export { savedEventRouter };

