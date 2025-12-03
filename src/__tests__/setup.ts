// Mock do Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  event: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  eventRegistration: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  savedEvent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@/database/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock do Pool do PostgreSQL
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    end: jest.fn(),
  })),
}));

// Mock do PrismaPg adapter
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(),
}));

// Mock dos serviços
jest.mock('@/services/permissionService', () => ({
  PermissionService: {
    getUserPermissions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/services/RefreshTokenService', () => ({
  refreshTokenService: {
    generate: jest.fn().mockReturnValue('refresh-token'),
    rotate: jest.fn(),
    revoke: jest.fn(),
  },
  getCookieOptions: jest.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600000,
  }),
  parseCookie: jest.fn(),
}));

// Limpar mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

export { mockPrisma };

