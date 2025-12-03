import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@/database/prisma'
import { HttpBadRequest, HttpNotFound, HttpUnauthorized } from '@/utils/exceptions/http'
import { EventStatus } from '../../prisma/@prisma/client/enums'

class SavedEventController {
  // Salvar evento
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
        status: true
      }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    if (event.status !== 'APPROVED') {
      throw new HttpBadRequest("Apenas eventos aprovados podem ser salvos")
    }

    // Verificar se já está salvo
    const existingSaved = await prisma.savedEvent.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: req.user.id
        }
      }
    })

    if (existingSaved) {
      throw new HttpBadRequest("Evento já está salvo")
    }

    const savedEvent = await prisma.savedEvent.create({
      data: {
        eventId,
        userId: req.user.id
      },
      include: {
        event: {
          include: {
            promoter: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      }
    })

    res.status(201).json(savedEvent)
  }

  // Remover evento salvo
  async delete(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      eventId: z.string().uuid()
    })

    const { eventId } = paramsSchema.parse(req.params)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const savedEvent = await prisma.savedEvent.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: req.user.id
        }
      }
    })

    if (!savedEvent) {
      throw new HttpNotFound("Evento não está salvo")
    }

    await prisma.savedEvent.delete({
      where: {
        id: savedEvent.id
      }
    })

    res.status(204).send()
  }

  // Listar eventos salvos do usuário
  async index(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const savedEvents = await prisma.savedEvent.findMany({
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

    res.status(200).json(savedEvents)
  }
}

export { SavedEventController }

