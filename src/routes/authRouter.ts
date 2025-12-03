import { Router, Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { authConfig } from '@/auth/jwt';
import { getCookieOptions, parseCookie, refreshTokenService } from '@/services/RefreshTokenService';
import { PermissionService } from '@/services/permissionService';
import { prisma } from '@/database/prisma';

const COOKIE_NAME = 'refresh_token';

const authRouter = Router();

authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const cookieHeader = req.headers.cookie as string | undefined;
  const current = parseCookie(cookieHeader, COOKIE_NAME);
  const rotated = current ? await refreshTokenService.rotate(current) : null;
  if (!rotated) {
    res.status(401).json({ message: 'Refresh inválido' });
    return;
  }

  const userId = String(rotated.record.userId);

  // Buscar dados do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approvedAt: true
    }
  });

  if (!user) {
    res.status(401).json({ message: 'Usuário não encontrado' });
    return;
  }

  // Buscar permissões do usuário
  const permissions = await PermissionService.getUserPermissions(userId);

  const accessToken = sign({ id: userId }, authConfig.secret, {
    subject: userId,
    expiresIn: authConfig.expiresIn,
  });

  res.cookie(COOKIE_NAME, rotated.newToken, getCookieOptions());
  res.status(200).json({
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvedAt: user.approvedAt
    },
    permissions: permissions
  });
  return;
});

authRouter.post('/sair', async (req: Request, res: Response): Promise<void> => {
  const cookieHeader = req.headers.cookie as string | undefined;
  const current = parseCookie(cookieHeader, COOKIE_NAME);
  await refreshTokenService.revoke(current);
  res.clearCookie(COOKIE_NAME, { ...getCookieOptions(), maxAge: 0 });
  res.status(204).send();
  return;
});

export { authRouter, COOKIE_NAME };

