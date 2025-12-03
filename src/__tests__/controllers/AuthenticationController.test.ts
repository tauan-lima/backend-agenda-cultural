import { Request, Response, NextFunction } from 'express';
import { AuthenticationController } from '@/controllers/AuthenticationController';
import { mockPrisma } from '../setup';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { refreshTokenService } from '@/services/RefreshTokenService';

// Mock dos módulos
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new AuthenticationController();
    mockRequest = {
      body: {},
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        name: 'Novo Usuário',
        email: 'novo@teste.com',
        senha: '123456',
      };

      mockRequest.body = userData;
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        name: userData.name,
        email: userData.email,
        password: 'hashed-password',
        role: 'USER',
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (hash as jest.Mock).mockResolvedValue('hashed-password');
      (sign as jest.Mock).mockReturnValue('jwt-token');
      jest.spyOn(refreshTokenService, 'generate').mockReturnValue('refresh-token');
      const PermissionService = require('@/services/permissionService').PermissionService;
      jest.spyOn(PermissionService, 'getUserPermissions').mockResolvedValue(['user']);

      await controller.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('deve retornar erro se email já existe', async () => {
      const userData = {
        name: 'Novo Usuário',
        email: 'existente@teste.com',
        senha: '123456',
      };

      mockRequest.body = userData;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: userData.email,
      });

      try {
        await controller.register(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.message).toContain('Email já cadastrado');
        return;
      }
      fail('Deveria ter lançado exceção');
    });

    it('deve validar nome mínimo de 3 caracteres', async () => {
      mockRequest.body = {
        name: 'Ab',
        email: 'teste@teste.com',
        senha: '123456',
      };

      try {
        await controller.register(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error).toBeDefined();
        return;
      }
      fail('Deveria ter lançado exceção de validação');
    });

    it('deve validar senha entre 6 e 20 caracteres', async () => {
      mockRequest.body = {
        name: 'Teste',
        email: 'teste@teste.com',
        senha: '12345', // Menos de 6 caracteres
      };

      try {
        await controller.register(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error).toBeDefined();
        return;
      }
      fail('Deveria ter lançado exceção de validação');
    });
  });

  describe('index (login)', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'usuario@teste.com',
        senha: '123456',
      };

      const mockUser = {
        id: 'user-id',
        name: 'Usuário',
        email: loginData.email,
        password: 'hashed-password',
        role: 'USER',
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = loginData;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      (sign as jest.Mock).mockReturnValue('jwt-token');
      jest.spyOn(refreshTokenService, 'generate').mockReturnValue('refresh-token');
      const PermissionService = require('@/services/permissionService').PermissionService;
      jest.spyOn(PermissionService, 'getUserPermissions').mockResolvedValue(['user']);

      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(compare).toHaveBeenCalledWith(loginData.senha, mockUser.password);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('deve retornar erro se usuário não existe', async () => {
      mockRequest.body = {
        email: 'naoexiste@teste.com',
        senha: '123456',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      try {
        await controller.index(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.message).toContain('Usuário ou senha inválidos');
        return;
      }
      fail('Deveria ter lançado exceção');
    });

    it('deve retornar erro se senha incorreta', async () => {
      const loginData = {
        email: 'usuario@teste.com',
        senha: 'senha-errada',
      };

      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        password: 'hashed-password',
      };

      mockRequest.body = loginData;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      try {
        await controller.index(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.message).toContain('Usuário ou senha inválidos');
        return;
      }
      fail('Deveria ter lançado exceção');
    });
  });
});

