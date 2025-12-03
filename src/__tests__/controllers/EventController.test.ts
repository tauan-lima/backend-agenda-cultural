import { Request, Response, NextFunction } from 'express';
import { EventController } from '@/controllers/EventController';
import { mockPrisma } from '../setup';

describe('EventController', () => {
  let controller: EventController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new EventController();
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-id', email: 'user@teste.com' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('create', () => {
    it('deve criar evento com sucesso', async () => {
      const eventData = {
        title: 'Festival de Música',
        description: 'Descrição do evento com mais de 10 caracteres',
        location: 'Parque Central',
        startDate: '2024-12-25T18:00:00.000Z',
        endDate: '2024-12-25T22:00:00.000Z',
        requiresRegistration: true,
      };

      mockRequest.body = eventData;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'promoter-id',
        role: 'PROMOTER',
        approvedAt: new Date(),
      });
      mockPrisma.event.create.mockResolvedValue({
        id: 'event-id',
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        status: 'PENDING',
        promoterId: 'promoter-id',
        imageUrl: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.event.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar erro se usuário não é promoter', async () => {
      mockRequest.body = {
        title: 'Evento',
        description: 'Descrição do evento',
        location: 'Local',
        startDate: '2024-12-25T18:00:00.000Z',
        endDate: '2024-12-25T22:00:00.000Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        role: 'USER',
        approvedAt: null,
      });

      try {
        await controller.create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Apenas promoters podem criar eventos');
      }
    });

    it('deve retornar erro se promoter não está aprovado', async () => {
      mockRequest.body = {
        title: 'Evento',
        description: 'Descrição do evento',
        location: 'Local',
        startDate: '2024-12-25T18:00:00.000Z',
        endDate: '2024-12-25T22:00:00.000Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'promoter-id',
        role: 'PROMOTER',
        approvedAt: null,
      });

      try {
        await controller.create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Promoter não aprovado');
      }
    });

    it('deve validar data de término posterior à data de início', async () => {
      mockRequest.body = {
        title: 'Evento',
        description: 'Descrição do evento',
        location: 'Local',
        startDate: '2024-12-25T22:00:00.000Z',
        endDate: '2024-12-25T18:00:00.000Z', // Data anterior
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'promoter-id',
        role: 'PROMOTER',
        approvedAt: new Date(),
      });

      try {
        await controller.create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Data de término deve ser posterior');
      }
    });
  });

  describe('index', () => {
    it('deve listar eventos aprovados', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      const mockEvents = [
        {
          id: eventId,
          title: 'Evento 1',
          status: 'APPROVED',
          promoter: { id: 'promoter-1', name: 'Promoter', email: 'promoter@teste.com' },
          _count: { registrations: 5 },
        },
      ];

      mockRequest.query = { page: '1', limit: '10' };
      mockPrisma.event.findMany.mockResolvedValue(mockEvents as any);
      mockPrisma.event.count.mockResolvedValue(1);

      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('myEvents', () => {
    it('deve listar eventos do promoter autenticado', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      const mockEvents = [
        {
          id: eventId,
          title: 'Meu Evento',
          status: 'PENDING',
          promoter: { id: 'promoter-id', name: 'Promoter', email: 'promoter@teste.com' },
          _count: { registrations: 0 },
        },
      ];

      mockRequest.query = {};
      mockPrisma.event.findMany.mockResolvedValue(mockEvents as any);
      mockPrisma.event.count.mockResolvedValue(1);

      await controller.myEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ promoterId: 'user-id' }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('approve', () => {
    it('deve aprovar evento (admin)', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: eventId };
      mockRequest.user = { id: 'admin-id', email: 'admin@teste.com' };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
      });
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'PENDING',
      });
      mockPrisma.event.update.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
        approvedBy: 'admin-id',
        approvedAt: new Date(),
      });

      await controller.approve(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.event.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar erro se não é admin', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: eventId };
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        role: 'USER',
      });

      try {
        await controller.approve(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Apenas administradores podem aprovar eventos');
      }
    });
  });

  describe('reject', () => {
    it('deve rejeitar evento com motivo (admin)', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: eventId };
      mockRequest.body = { rejectionReason: 'Conteúdo inadequado' };
      mockRequest.user = { id: 'admin-id', email: 'admin@teste.com' };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
      });
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
      });
      mockPrisma.event.update.mockResolvedValue({
        id: eventId,
        status: 'REJECTED',
        rejectionReason: 'Conteúdo inadequado',
      });

      await controller.reject(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.event.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('revoke', () => {
    it('deve revogar evento aprovado (admin)', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: eventId };
      mockRequest.user = { id: 'admin-id', email: 'admin@teste.com' };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
      });
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
      });
      mockPrisma.event.update.mockResolvedValue({
        id: eventId,
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      });

      await controller.revoke(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING' }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});

