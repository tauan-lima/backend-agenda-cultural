import { Router } from "express";
import { PromoterController } from "@/controllers/PromoterController";
import { authenticationHandler } from "@/middlewares/AuthenticationHandler";
import { authorizationHandler } from "@/middlewares/AuthontizationHandler";

const promoterRouter = Router();
const promoterController = new PromoterController();

// Solicitar se tornar promoter (usuário autenticado)
promoterRouter.post("/solicitar", authenticationHandler, promoterController.request);

// Listar promoters pendentes (apenas admin)
promoterRouter.get("/pendentes", authenticationHandler, authorizationHandler(["admin"]), promoterController.index);

// Aprovar promoter (apenas admin)
promoterRouter.post("/:id/aprovar", authenticationHandler, authorizationHandler(["admin"]), promoterController.approve);

// Rejeitar promoter (apenas admin)
promoterRouter.post("/:id/rejeitar", authenticationHandler, authorizationHandler(["admin"]), promoterController.reject);

export { promoterRouter };

