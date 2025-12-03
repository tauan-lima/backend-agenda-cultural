import { prisma } from "@/database/prisma";
import { Prisma } from '../../prisma/@prisma/client/client';

export class PermissionServiceError extends Error { }

export class PermissionService {
  static async getUserPermissions(userId: string): Promise<string[]> {
    // Busca o usuário para obter o role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return [];
    }

    // Retorna o role do usuário em lowercase como permissão
    // ADMIN -> ["admin"]
    // PROMOTER -> ["promoter"]
    // USER -> ["user"]
    return [user.role.toLowerCase()];

    // TODO: Implementar quando os modelos de permissões forem adicionados ao schema
    // const permissions = await prisma.permissions.findMany({
    //   where: {
    //     OR: [
    //       { permissions: { some: { userId } } },
    //       { permissions: { some: { group: { users: { some: { userId } } } } } },
    //     ],
    //   },
    //   distinct: ["name"],
    //   select: { name: true },
    // });
    // return permissions.map((permission: { name: string }) => permission.name);
  }

  static async addUserPermissions(userId: string, permissionNames: string[]) {
    // TODO: Implementar quando os modelos de permissões forem adicionados ao schema
    throw new PermissionServiceError("Funcionalidade não implementada - modelos de permissões não estão no schema");
  }

  static async removeUserPermissions(userId: string, permissionNames: string[]) {
    // TODO: Implementar quando os modelos de permissões forem adicionados ao schema
    throw new PermissionServiceError("Funcionalidade não implementada - modelos de permissões não estão no schema");
  }

  static async addUserGroupPermission(userId: string, groupId: number) {
    // TODO: Implementar quando os modelos de grupos forem adicionados ao schema
    throw new PermissionServiceError("Funcionalidade não implementada - modelos de grupos não estão no schema");
  }

  static async removeUserGroupPermission(userId: string, groupId: number) {
    // TODO: Implementar quando os modelos de grupos forem adicionados ao schema
    throw new PermissionServiceError("Funcionalidade não implementada - modelos de grupos não estão no schema");
  }
}
