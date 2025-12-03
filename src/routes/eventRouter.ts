import { Router } from "express";
import { EventController } from "@/controllers/EventController";
import { authenticationHandler } from "@/middlewares/AuthenticationHandler";
import { authorizationHandler } from "@/middlewares/AuthontizationHandler";

const eventRouter = Router();
const eventController = new EventController();

// Criar evento (promoter autenticado)
eventRouter.post("/", authenticationHandler, eventController.create);

// Listar eventos do promoter autenticado (todos os status)
eventRouter.get("/meus", authenticationHandler, eventController.myEvents);

// Listar eventos pendentes (apenas admin)
eventRouter.get("/pendentes", authenticationHandler, authorizationHandler(["admin"]), eventController.pendingEvents);

// Listar eventos (público - apenas aprovados)
eventRouter.get("/", eventController.index);

// Buscar evento específico (público - apenas aprovados)
eventRouter.get("/:id", eventController.show);

// Atualizar evento (promoter dono)
eventRouter.put("/:id", authenticationHandler, eventController.update);

// Aprovar evento (apenas admin)
eventRouter.put("/:id/aprovar", authenticationHandler, authorizationHandler(["admin"]), eventController.approve);

// Rejeitar evento (apenas admin)
eventRouter.put("/:id/rejeitar", authenticationHandler, authorizationHandler(["admin"]), eventController.reject);

// Revogar evento aprovado (apenas admin) - volta para pendente
eventRouter.put("/:id/revogar", authenticationHandler, authorizationHandler(["admin"]), eventController.revoke);

// Cancelar evento (promoter dono)
eventRouter.put("/:id/cancelar", authenticationHandler, eventController.cancel);

export { eventRouter };

