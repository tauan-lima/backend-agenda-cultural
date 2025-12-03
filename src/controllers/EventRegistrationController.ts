import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@/database/prisma'
import { HttpBadRequest, HttpForbidden, HttpNotFound, HttpUnauthorized } from '@/utils/exceptions/http'
import { EventStatus, UserRole } from '../../prisma/@prisma/client/enums'

class EventRegistrationController {
  // Inscrever-se em evento
  async create(req: Request, res: Response, next: NextFunction) {
    const bodySchema = z.object({
      eventId: z.string().uuid()
    })

    const { eventId } = bodySchema.parse(req.body)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        requiresRegistration: true,
        startDate: true
      }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    if (event.status !== 'APPROVED') {
      throw new HttpBadRequest("Evento não está aprovado")
    }

    if (!event.requiresRegistration) {
      throw new HttpBadRequest("Evento não requer inscrição")
    }

    if (new Date(event.startDate) < new Date()) {
      throw new HttpBadRequest("Evento já iniciou")
    }

    // Verificar se já está inscrito
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: req.user.id
        }
      }
    })

    if (existingRegistration) {
      throw new HttpBadRequest("Usuário já está inscrito neste evento")
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId: req.user.id
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.status(201).json(registration)
  }

  // Cancelar inscrição
  async delete(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      eventId: z.string().uuid()
    })

    const { eventId } = paramsSchema.parse(req.params)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: req.user.id
        }
      }
    })

    if (!registration) {
      throw new HttpNotFound("Inscrição não encontrada")
    }

    await prisma.eventRegistration.delete({
      where: {
        id: registration.id
      }
    })

    res.status(204).send()
  }

  // Listar eventos em que o usuário está inscrito
  async myRegistrations(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        event: {
          include: {
            promoter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json(registrations.map(r => ({
      id: r.id,
      eventId: r.eventId,
      createdAt: r.createdAt,
      event: r.event
    })))
  }

  // Listar inscritos em evento (apenas promoter dono ou admin)
  async index(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      eventId: z.string().uuid()
    })

    const { eventId } = paramsSchema.parse(req.params)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        promoterId: true
      }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    // Verificar se é admin ou promoter dono do evento
    if (user?.role !== 'ADMIN' && event.promoterId !== req.user.id) {
      throw new HttpForbidden("Apenas o promoter dono ou admin podem ver os inscritos")
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    res.status(200).json({
      eventId,
      total: registrations.length,
      registrations: registrations.map(r => ({
        id: r.id,
        user: r.user,
        createdAt: r.createdAt
      }))
    })
  }
}

export { EventRegistrationController }

