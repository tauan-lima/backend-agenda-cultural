import { Request, Response, NextFunction } from 'express';
import { PromoterController } from '@/controllers/PromoterController';
import { mockPrisma } from '../setup';

describe('PromoterController', () => {
  let controller: PromoterController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new PromoterController();
    mockRequest = {
      params: {},
      user: { id: 'user-id', email: 'user@teste.com' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('request', () => {
    it('deve solicitar se tornar promoter com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        role: 'USER',
        approvedAt: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        name: 'Usuário',
        email: 'user@teste.com',
        role: 'PROMOTER',
        approvedAt: null,
      });

      await controller.request(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'PROMOTER' }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar erro se já é promoter aprovado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        role: 'PROMOTER',
        approvedAt: new Date(),
      });

      try {
        await controller.request(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('já é um promoter aprovado');
      }
    });

    it('deve retornar erro se admin tenta solicitar', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
        approvedAt: null,
      });

      try {
        await controller.request(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Administradores não podem se tornar promoters');
      }
    });
  });

  describe('index (listar pendentes)', () => {
    it('deve listar promoters pendentes (admin)', async () => {
      mockRequest.user = { id: 'admin-id', email: 'admin@teste.com' };

      const promoterId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPromoters = [
        {
          id: promoterId,
          name: 'Promoter 1',
          email: 'promoter1@teste.com',
          createdAt: new Date(),
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
      });
      mockPrisma.user.findMany.mockResolvedValue(mockPromoters as any);

      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar erro se não é admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        role: 'USER',
      });

      try {
        await controller.index(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
        fail('Deveria ter lançado exceção');
      } catch (error: any) {
        expect(error.message).toContain('Apenas administradores podem ver promoters pendentes');
      }
    });
  });

  describe('approve', () => {
    it('deve aprovar promoter (admin)', async () => {
      const promoterId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: promoterId };
      mockRequest.user = { id: 'admin-id', email: 'admin@teste.com' };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'admin-id', role: 'ADMIN' })
        .mockResolvedValueOnce({
          id: promoterId,
          role: 'PROMOTER',
          approvedAt: null,
        });

      mockPrisma.user.update.mockResolvedValue({
        id: promoterId,
        name: 'Promoter',
        email: 'promoter@teste.com',
        approvedAt: new Date(),
      });

      await controller.approve(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('reject', () => {
    it('deve rejeitar promoter (admin)', async () => {
      const promoterId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: promoterId };
      mockRequest.user = { id: 'admin-id', email: 'admin@teste.com' };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'admin-id', role: 'ADMIN' })
        .mockResolvedValueOnce({
          id: promoterId,
          role: 'PROMOTER',
        });

      mockPrisma.user.update.mockResolvedValue({
        id: promoterId,
        name: 'Usuário',
        email: 'user@teste.com',
        role: 'USER',
      });

      await controller.reject(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'USER' }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});

