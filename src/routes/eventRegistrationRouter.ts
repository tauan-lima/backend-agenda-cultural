import { Router } from "express";
import { EventRegistrationController } from "@/controllers/EventRegistrationController";
import { authenticationHandler } from "@/middlewares/AuthenticationHandler";

const eventRegistrationRouter = Router();
const eventRegistrationController = new EventRegistrationController();

// Listar eventos em que o usuário está inscrito
eventRegistrationRouter.get("/meus", authenticationHandler, eventRegistrationController.myRegistrations);

// Inscrever-se em evento (usuário autenticado)
eventRegistrationRouter.post("/", authenticationHandler, eventRegistrationController.create);

// Cancelar inscrição (usuário autenticado)
eventRegistrationRouter.delete("/:eventId", authenticationHandler, eventRegistrationController.delete);

// Listar inscritos (promoter dono ou admin)
eventRegistrationRouter.get("/:eventId/inscritos", authenticationHandler, eventRegistrationController.index);

export { eventRegistrationRouter };

