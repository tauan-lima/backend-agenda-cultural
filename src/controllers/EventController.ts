import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@/database/prisma'
import { HttpBadRequest, HttpForbidden, HttpNotFound, HttpUnauthorized } from '@/utils/exceptions/http'
import { EventStatus, UserRole } from '../../prisma/@prisma/client/enums'

class EventController {
  // Criar evento (apenas promoters aprovados)
  async create(req: Request, res: Response, next: NextFunction) {
    const eventSchema = z.object({
      title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
      description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
      location: z.string().min(3, "Localização é obrigatória"),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      imageUrl: z.string().url().optional(),
      requiresRegistration: z.boolean().default(true)
    })

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

    if (user.role !== 'PROMOTER') {
      throw new HttpForbidden("Apenas promoters podem criar eventos")
    }

    if (!user.approvedAt) {
      throw new HttpForbidden("Promoter não aprovado")
    }

    const data = eventSchema.parse(req.body)
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      throw new HttpBadRequest("Data de término deve ser posterior à data de início")
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate,
        endDate,
        imageUrl: data.imageUrl,
        requiresRegistration: data.requiresRegistration,
        promoterId: req.user.id,
        status: 'PENDING' as EventStatus
      }
    })

    res.status(201).json(event)
  }

  // Listar eventos (público - apenas aprovados)
  async index(req: Request, res: Response, next: NextFunction) {
    const querySchema = z.object({
      promoterId: z.string().uuid().optional(),
      page: z.string().optional().transform(val => val ? parseInt(val) : 1),
      limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
    })

    const query = querySchema.parse(req.query)
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const where: any = {
      status: 'APPROVED' as EventStatus
    }

    if (query.promoterId) {
      where.promoterId = query.promoterId
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
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
        },
        orderBy: {
          startDate: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    res.status(200).json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }

  // Buscar evento específico (público - apenas aprovados)
  async show(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    const event = await prisma.event.findFirst({
      where: {
        id,
        status: 'APPROVED' as EventStatus
      },
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
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    res.status(200).json(event)
  }

  // Atualizar evento (apenas promoter dono)
  async update(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const eventSchema = z.object({
      title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").optional(),
      description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres").optional(),
      location: z.string().min(3, "Localização é obrigatória").optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      imageUrl: z.string().url().optional().nullable(),
      requiresRegistration: z.boolean().optional()
    })

    const { id } = paramsSchema.parse(req.params)
    const data = eventSchema.parse(req.body)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { promoterId: true, status: true }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    if (event.promoterId !== req.user.id) {
      throw new HttpForbidden("Apenas o promoter dono pode atualizar o evento")
    }

    // Se evento já foi aprovado, volta para pendente após atualização
    const updateData: any = {}

    if (data.title) updateData.title = data.title
    if (data.description) updateData.description = data.description
    if (data.location) updateData.location = data.location
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.requiresRegistration !== undefined) updateData.requiresRegistration = data.requiresRegistration

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate)
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate)
    }

    // Validar datas se ambas foram fornecidas
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        throw new HttpBadRequest("Data de término deve ser posterior à data de início")
      }
    } else if (data.startDate || data.endDate) {
      // Se apenas uma data foi fornecida, buscar a outra do evento atual
      const currentEvent = await prisma.event.findUnique({
        where: { id },
        select: { startDate: true, endDate: true }
      })

      const startDate = updateData.startDate || currentEvent?.startDate
      const endDate = updateData.endDate || currentEvent?.endDate

      if (startDate && endDate && endDate <= startDate) {
        throw new HttpBadRequest("Data de término deve ser posterior à data de início")
      }
    }

    // Se evento estava aprovado e foi atualizado, volta para pendente
    if (event.status === 'APPROVED') {
      updateData.status = 'PENDING' as EventStatus
      updateData.approvedBy = null
      updateData.approvedAt = null
      updateData.rejectionReason = null
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
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
    })

    res.status(200).json(updatedEvent)
  }

  // Aprovar evento (apenas admin)
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
      throw new HttpForbidden("Apenas administradores podem aprovar eventos")
    }

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: 'APPROVED' as EventStatus,
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    })

    res.status(200).json(updatedEvent)
  }

  // Rejeitar evento (apenas admin)
  async reject(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const bodySchema = z.object({
      rejectionReason: z.string().min(5, "Motivo da rejeição é obrigatório")
    })

    const { id } = paramsSchema.parse(req.params)
    const { rejectionReason } = bodySchema.parse(req.body)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      throw new HttpForbidden("Apenas administradores podem rejeitar eventos")
    }

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: 'REJECTED' as EventStatus,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        rejectionReason
      }
    })

    res.status(200).json(updatedEvent)
  }

  // Cancelar evento (apenas o promoter dono)
  async cancel(req: Request, res: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { promoterId: true, status: true }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    if (event.promoterId !== req.user.id) {
      throw new HttpForbidden("Apenas o promoter dono pode cancelar o evento")
    }

    if (event.status === 'CANCELLED') {
      throw new HttpBadRequest("Evento já está cancelado")
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: 'CANCELLED' as EventStatus
      }
    })

    res.status(200).json(updatedEvent)
  }

  // Listar eventos do promoter autenticado (todos os status)
  async myEvents(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const querySchema = z.object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
      page: z.string().optional().transform(val => val ? parseInt(val) : 1),
      limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
    })

    const query = querySchema.parse(req.query)
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const where: any = {
      promoterId: req.user.id
    }

    if (query.status) {
      where.status = query.status as EventStatus
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    res.status(200).json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }

  // Listar eventos pendentes (apenas admin)
  async pendingEvents(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      throw new HttpUnauthorized("Usuário não autenticado")
    }

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      throw new HttpForbidden("Apenas administradores podem ver eventos pendentes")
    }

    const querySchema = z.object({
      page: z.string().optional().transform(val => val ? parseInt(val) : 1),
      limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
    })

    const query = querySchema.parse(req.query)
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const where = {
      status: 'PENDING' as EventStatus
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    res.status(200).json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }

  // Revogar evento aprovado (apenas admin) - volta para pendente
  async revoke(req: Request, res: Response, next: NextFunction) {
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
      throw new HttpForbidden("Apenas administradores podem revogar eventos")
    }

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      throw new HttpNotFound("Evento não encontrado")
    }

    if (event.status !== 'APPROVED') {
      throw new HttpBadRequest("Apenas eventos aprovados podem ser revogados")
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: 'PENDING' as EventStatus,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null
      },
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
    })

    res.status(200).json(updatedEvent)
  }
}

export { EventController }

