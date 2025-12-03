import { Router } from "express";
import { authenticationRouter } from "./authenticationRouter";
import { eventRouter } from "./eventRouter";
import { promoterRouter } from "./promoterRouter";
import { eventRegistrationRouter } from "./eventRegistrationRouter";
import { savedEventRouter } from "./savedEventRouter";
import { adminRouter } from "./adminRouter";

const router = Router();

router.use("/entrar", authenticationRouter);
router.use("/eventos", eventRouter);
router.use("/promoters", promoterRouter);
router.use("/inscricoes", eventRegistrationRouter);
router.use("/eventos-salvos", savedEventRouter);
router.use("/admin", adminRouter);

export { router };
