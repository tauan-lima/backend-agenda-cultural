import { Router } from 'express';
import { AdminStatsController } from '@/controllers/AdminStatsController';
import { authenticationHandler } from '@/middlewares/AuthenticationHandler';
import { authorizationHandler } from '@/middlewares/AuthontizationHandler';

const adminRouter = Router();
const adminStatsController = new AdminStatsController();

// Estatísticas administrativas (apenas admin)
adminRouter.get('/stats', authenticationHandler, authorizationHandler(['admin']), adminStatsController.index);

export { adminRouter };

