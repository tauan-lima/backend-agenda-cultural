import { sign } from 'jsonwebtoken'
import { authConfig } from '@/auth/jwt'
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@/database/prisma'
import { HttpUnauthorized } from '@/utils/exceptions/http'
import { compare } from 'bcrypt'
import { COOKIE_NAME, } from '@/routes/authRouter'
import { getCookieOptions, refreshTokenService } from '@/services/RefreshTokenService'
import { PermissionService } from '@/services/permissionService'


class AuthenticationController {
  async index(req: Request, res: Response, next: NextFunction) {
    const authSchema = z.object({
      email: z.string({ message: "O email deve ser em String" }).email().trim(),
      senha: z.string({ message: "A senha deve ser em String" }).min(6).max(20).trim()
    })

    const { email, senha } = authSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new HttpUnauthorized("Usuário ou senha inválidos")
    }
    const passwordMatch = await compare(senha, user.password)

    if (!passwordMatch) {
      throw new HttpUnauthorized("Usuário ou senha inválidos")
    }

    const token = sign({ id: user.id, email: user.email }, authConfig.secret, { subject: String(user.id), expiresIn: authConfig.expiresIn })
    const refresh = refreshTokenService.generate(user.id);
    res.cookie(COOKIE_NAME, refresh, getCookieOptions());

    // Buscar permissões do usuário
    const permissions = await PermissionService.getUserPermissions(user.id);

    res.status(200).json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      permissions: permissions
    })
  }
}

export { AuthenticationController }
