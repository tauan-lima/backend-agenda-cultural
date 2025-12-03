import { Request, Response, NextFunction } from 'express';
import { EventRegistrationController } from '@/controllers/EventRegistrationController';
import { mockPrisma } from '../setup';

describe('EventRegistrationController', () => {
  let controller: EventRegistrationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new EventRegistrationController();
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
    it('deve inscrever usuário em evento com sucesso', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.body = { eventId };

      // Data futura para o evento
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
        requiresRegistration: true,
        startDate: futureDate,
      });

      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      mockPrisma.eventRegistration.create.mockResolvedValue({
        id: 'registration-id',
        eventId: eventId,
        userId: 'user-id',
        createdAt: new Date(),
        event: { id: eventId, title: 'Evento', startDate: new Date() },
        user: { id: 'user-id', name: 'Usuário', email: 'user@teste.com' },
      });

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.eventRegistration.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar erro se evento não requer inscrição', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.body = { eventId };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
        requiresRegistration: false,
        startDate: futureDate,
      });

      try {
        await controller.create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Evento não requer inscrição');
      }
    });

    it('deve retornar erro se já está inscrito', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.body = { eventId };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        status: 'APPROVED',
        requiresRegistration: true,
        startDate: futureDate,
      });

      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'existing-registration',
      });

      try {
        await controller.create(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('já está inscrito');
      }
    });
  });

  describe('delete', () => {
    it('deve cancelar inscrição com sucesso', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { eventId };

      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'registration-id',
        eventId: eventId,
        userId: 'user-id',
      });

      mockPrisma.eventRegistration.delete.mockResolvedValue({} as any);

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.eventRegistration.delete).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });
  });

  describe('myRegistrations', () => {
    it('deve listar eventos inscritos do usuário', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174000';
      const mockRegistrations = [
        {
          id: 'reg-1',
          eventId: eventId,
          createdAt: new Date(),
          event: {
            id: eventId,
            title: 'Evento',
            promoter: { id: 'promoter-1', name: 'Promoter', email: 'promoter@teste.com' },
            _count: { registrations: 10 },
          },
        },
      ];

      mockPrisma.eventRegistration.findMany.mockResolvedValue(mockRegistrations as any);

      await controller.myRegistrations(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.eventRegistration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-id' },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});

