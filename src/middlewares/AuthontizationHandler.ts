import { PermissionService } from "@/services/permissionService";
import { HttpUnauthorized } from "@/utils/exceptions/http";
import { Request, Response, NextFunction } from "express";

type OperationType = "all" | "any";

function roleHandler(requiredRoles: string[], userRoles: string[], operator: OperationType = "all"): boolean {
  const operation = operator === "all" ? requiredRoles.every.bind(requiredRoles) : requiredRoles.some.bind(requiredRoles);
  return operation(role => userRoles.includes(role));
}

function authorizationHandler(
  roles: string[],
  byPassRoles: string[] = ["admin"],
  operator: OperationType = "all"
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        throw new HttpUnauthorized("Usuário não autenticado");
      }

      const userRoles = await PermissionService.getUserPermissions(req.user.id);

      const hasByPassRoles = roleHandler(byPassRoles, userRoles, "any");

      const hasRoles = roleHandler(roles, userRoles, operator);

      if (hasByPassRoles || hasRoles) {
        return next();
      }

      throw new HttpUnauthorized("Usuário não autorizado");
    } catch (error) {
      next(error);
    }
  };
}

export { authorizationHandler };
