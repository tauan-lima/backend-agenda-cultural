import { sign } from 'jsonwebtoken'
import { authConfig } from '@/auth/jwt'
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@/database/prisma'
import { HttpUnauthorized, HttpBadRequest } from '@/utils/exceptions/http'
import { compare, hash } from 'bcrypt'
import { COOKIE_NAME, } from '@/routes/authRouter'
import { getCookieOptions, refreshTokenService } from '@/services/RefreshTokenService'
import { PermissionService } from '@/services/permissionService'


class AuthenticationController {
  // Registrar novo usuário
  async register(req: Request, res: Response, next: NextFunction) {
    const registerSchema = z.object({
      name: z.string({ message: "O nome deve ser em String" }).min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
      email: z.string({ message: "O email deve ser em String" }).email("Email inválido").trim(),
      senha: z.string({ message: "A senha deve ser em String" }).min(6, "Senha deve ter no mínimo 6 caracteres").max(20, "Senha deve ter no máximo 20 caracteres").trim()
    })

    const { name, email, senha } = registerSchema.parse(req.body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new HttpBadRequest("Email já cadastrado")
    }

    // Fazer hash da senha
    const hashedPassword = await hash(senha, 10)

    // Criar usuário (role padrão é USER)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER' // Role padrão
      }
    })

    // Gerar token
    const token = sign({ id: user.id, email: user.email }, authConfig.secret, { subject: String(user.id), expiresIn: authConfig.expiresIn })
    const refresh = refreshTokenService.generate(user.id);
    res.cookie(COOKIE_NAME, refresh, getCookieOptions());

    // Buscar permissões do usuário
    const permissions = await PermissionService.getUserPermissions(user.id);

    res.status(201).json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvedAt: user.approvedAt,
      },
      permissions: permissions
    })
  }

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
        role: user.role,
        approvedAt: user.approvedAt, // Importante para promoters verificarem se estão aprovados
      },
      permissions: permissions
    })
  }
}

export { AuthenticationController }
