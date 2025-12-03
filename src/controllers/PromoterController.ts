import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@/database/prisma'
import { HttpForbidden, HttpNotFound, HttpUnauthorized } from '@/utils/exceptions/http'
import { UserRole } from '../../prisma/@prisma/client/enums'

class PromoterController {
  // Solicitar se tornar promoter (usuário autenticado)
  async request(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, approvedAt: true }
    })

    if (!user) {
      throw new HttpNotFound("Usuário não encontrado")
    }

    // Verificar se já é promoter
    if (user.role === 'PROMOTER') {
      if (user.approvedAt) {
        throw new HttpForbidden("Você já é um promoter aprovado")
      } else {
        throw new HttpForbidden("Sua solicitação de promoter já está pendente de aprovação")
      }
    }

    // Verificar se é admin (admins não podem se tornar promoters)
    if (user.role === 'ADMIN') {
      throw new HttpForbidden("Administradores não podem se tornar promoters")
    }

    // Atualizar role para PROMOTER (pendente de aprovação)
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        role: 'PROMOTER' as UserRole,
        approvedAt: null, // Pendente de aprovação
        approvedBy: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvedAt: true
      }
    })

    res.status(200).json({
      message: "Solicitação de promoter enviada com sucesso. Aguarde aprovação de um administrador.",
      user: updatedUser
    })
  }

  // Listar promoters pendentes (apenas admin)
  async index(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      throw new HttpForbidden("Apenas administradores podem ver promoters pendentes")
    }

    const promoters = await prisma.user.findMany({
      where: {
        role: UserRole.PROMOTER,
        approvedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    res.status(200).json(promoters)
  }

  // Aprovar promoter (apenas admin)
  async approve(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      throw new HttpForbidden("Apenas administradores podem aprovar promoters")
    }

    const promoter = await prisma.user.findUnique({
      where: { id },
      select: { role: true, approvedAt: true }
    })

    if (!promoter) {
      throw new HttpNotFound("Promoter não encontrado")
    }

    if (promoter.role !== 'PROMOTER') {
      throw new HttpForbidden("Usuário não é um promoter")
    }

    if (promoter.approvedAt) {
      throw new HttpForbidden("Promoter já está aprovado")
    }

    const updatedPromoter = await prisma.user.update({
      where: { id },
      data: {
        approvedAt: new Date(),
        approvedBy: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        approvedAt: true
      }
    })

    res.status(200).json(updatedPromoter)
  }

  // Rejeitar promoter (apenas admin) - remover role de promoter
  async reject(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      throw new HttpForbidden("Apenas administradores podem rejeitar promoters")
    }

    const promoter = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!promoter) {
      throw new HttpNotFound("Promoter não encontrado")
    }

    if (promoter.role !== 'PROMOTER') {
      throw new HttpForbidden("Usuário não é um promoter")
    }

    // Reverter para USER ao invés de deletar
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: 'USER' as UserRole,
        approvedAt: null,
        approvedBy: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    res.status(200).json(updatedUser)
  }
}

export { PromoterController }

