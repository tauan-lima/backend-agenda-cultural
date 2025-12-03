import { Request, Response, NextFunction } from 'express';
import { SavedEventController } from '@/controllers/SavedEventController';
import { mockPrisma } from '../setup';

describe('SavedEventController', () => {
  let controller: SavedEventController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new SavedEventController();
    mockRequest = {
      body: {},
      params: {},
      user: { id: 'user-id', email: 'user@teste.com' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('create', () => {
    it('deve salvar evento com sucesso', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.body = { eventId };

      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
      });

      mockPrisma.savedEvent.findUnique.mockResolvedValue(null);
      mockPrisma.savedEvent.create.mockResolvedValue({
        id: 'saved-id',
        eventId: eventId,
        userId: 'user-id',
        createdAt: new Date(),
        event: {
          id: eventId,
          title: 'Evento',
          promoter: { id: 'promoter-1', name: 'Promoter' },
          _count: { registrations: 5 },
        },
      });

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.savedEvent.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar erro se evento já está salvo', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.body = { eventId };

      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
      });

      mockPrisma.savedEvent.findUnique.mockResolvedValue({
        id: 'existing-saved',
      });

      try {
        await controller.create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Evento já está salvo');
      }
    });
  });

  describe('delete', () => {
    it('deve remover evento salvo com sucesso', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { eventId };

      mockPrisma.savedEvent.findUnique.mockResolvedValue({
        id: 'saved-id',
        eventId: eventId,
        userId: 'user-id',
      });

      mockPrisma.savedEvent.delete.mockResolvedValue({} as any);

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.savedEvent.delete).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });
  });

  describe('index', () => {
    it('deve listar eventos salvos do usuário', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSavedEvents = [
        {
          id: 'saved-1',
          eventId: eventId,
          userId: 'user-id',
          createdAt: new Date(),
          event: {
            id: eventId,
            title: 'Evento',
            promoter: { id: 'promoter-1', name: 'Promoter', email: 'promoter@teste.com' },
            _count: { registrations: 5 },
          },
        },
      ];

      mockPrisma.savedEvent.findMany.mockResolvedValue(mockSavedEvents as any);

      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.savedEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-id' },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});

