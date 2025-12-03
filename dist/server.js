'use strict';

require('dotenv/config');
var runtime2 = require('@prisma/client/runtime/client');
var path = require('path');
var url = require('url');
var pg = require('pg');
var adapterPg = require('@prisma/adapter-pg');
var crypto = require('crypto');
var NodeCache = require('node-cache');
var express = require('express');
var jsonwebtoken = require('jsonwebtoken');
var zod = require('zod');
var bcrypt = require('bcrypt');
require('express-async-error');
var cors = require('cors');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var runtime2__namespace = /*#__PURE__*/_interopNamespace(runtime2);
var path__namespace = /*#__PURE__*/_interopNamespace(path);
var NodeCache__default = /*#__PURE__*/_interopDefault(NodeCache);
var express__default = /*#__PURE__*/_interopDefault(express);
var cors__default = /*#__PURE__*/_interopDefault(cors);

var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var authConfig;
var init_jwt = __esm({
  "src/auth/jwt.ts"() {
    authConfig = {
      secret: process.env.JWT_PRIVATE_KEY || process.env.JWT_SECRET || "defaultSecret",
      expiresIn: process.env.JWT_TIMEOUT || process.env.AUTH_EXPIRES_IN || "1d"
    };
  }
});
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import('buffer');
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
function getPrismaClientClass() {
  return runtime2__namespace.getPrismaClient(config);
}
var config;
var init_class = __esm({
  "prisma/@prisma/client/internal/class.ts"() {
    config = {
      "previewFeatures": [],
      "clientVersion": "7.0.1",
      "engineVersion": "f09f2815f091dbba658cdcd2264306d88bb5bda6",
      "activeProvider": "postgresql",
      "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "@prisma/client"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum UserRole {\n  ADMIN\n  PROMOTER\n  USER\n}\n\nenum EventStatus {\n  PENDING\n  APPROVED\n  REJECTED\n  CANCELLED\n}\n\nmodel User {\n  id         String    @id @default(uuid())\n  name       String\n  email      String    @unique\n  password   String\n  role       UserRole  @default(USER)\n  // Para promoters aguardando aprova\xE7\xE3o\n  approvedAt DateTime?\n  approvedBy String? // ID do admin que aprovou\n  createdAt  DateTime  @default(now())\n  updatedAt  DateTime  @updatedAt\n\n  // Rela\xE7\xF5es\n  approvedPromoters  User[]              @relation("PromoterApprovals")\n  approver           User?               @relation("PromoterApprovals", fields: [approvedBy], references: [id])\n  createdEvents      Event[]\n  eventRegistrations EventRegistration[]\n  savedEvents        SavedEvent[]\n\n  @@map("users")\n}\n\nmodel Event {\n  id                   String      @id @default(uuid())\n  title                String\n  description          String      @db.Text\n  location             String\n  startDate            DateTime\n  endDate              DateTime\n  imageUrl             String?\n  // Se o evento requer inscri\xE7\xE3o ou \xE9 aberto ao p\xFAblico\n  requiresRegistration Boolean     @default(true)\n  // Status de aprova\xE7\xE3o do evento\n  status               EventStatus @default(PENDING)\n  // Promoter que criou o evento\n  promoterId           String\n  promoter             User        @relation(fields: [promoterId], references: [id], onDelete: Cascade)\n  // Admin que aprovou/rejeitou o evento\n  approvedBy           String?\n  approvedAt           DateTime?\n  rejectionReason      String?     @db.Text\n  createdAt            DateTime    @default(now())\n  updatedAt            DateTime    @updatedAt\n\n  // Rela\xE7\xF5es\n  registrations EventRegistration[]\n  savedByUsers  SavedEvent[]\n\n  @@index([promoterId])\n  @@index([status])\n  @@index([startDate])\n  @@map("events")\n}\n\nmodel EventRegistration {\n  id        String   @id @default(uuid())\n  eventId   String\n  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  createdAt DateTime @default(now())\n\n  @@unique([eventId, userId])\n  @@index([eventId])\n  @@index([userId])\n  @@map("event_registrations")\n}\n\nmodel SavedEvent {\n  id        String   @id @default(uuid())\n  eventId   String\n  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  createdAt DateTime @default(now())\n\n  @@unique([eventId, userId])\n  @@index([eventId])\n  @@index([userId])\n  @@map("saved_events")\n}\n',
      "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
      }
    };
    config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"approvedAt","kind":"scalar","type":"DateTime"},{"name":"approvedBy","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"approvedPromoters","kind":"object","type":"User","relationName":"PromoterApprovals"},{"name":"approver","kind":"object","type":"User","relationName":"PromoterApprovals"},{"name":"createdEvents","kind":"object","type":"Event","relationName":"EventToUser"},{"name":"eventRegistrations","kind":"object","type":"EventRegistration","relationName":"EventRegistrationToUser"},{"name":"savedEvents","kind":"object","type":"SavedEvent","relationName":"SavedEventToUser"}],"dbName":"users"},"Event":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"endDate","kind":"scalar","type":"DateTime"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"requiresRegistration","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"EventStatus"},{"name":"promoterId","kind":"scalar","type":"String"},{"name":"promoter","kind":"object","type":"User","relationName":"EventToUser"},{"name":"approvedBy","kind":"scalar","type":"String"},{"name":"approvedAt","kind":"scalar","type":"DateTime"},{"name":"rejectionReason","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"registrations","kind":"object","type":"EventRegistration","relationName":"EventToEventRegistration"},{"name":"savedByUsers","kind":"object","type":"SavedEvent","relationName":"EventToSavedEvent"}],"dbName":"events"},"EventRegistration":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"event","kind":"object","type":"Event","relationName":"EventToEventRegistration"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"EventRegistrationToUser"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"event_registrations"},"SavedEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"event","kind":"object","type":"Event","relationName":"EventToSavedEvent"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SavedEventToUser"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"saved_events"}},"enums":{},"types":{}}');
    config.compilerWasm = {
      getRuntime: async () => await import('@prisma/client/runtime/query_compiler_bg.postgresql.mjs'),
      getQueryCompilerWasmModule: async () => {
        const { wasm } = await import('@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.mjs');
        return await decodeBase64AsWasm(wasm);
      }
    };
  }
});
var init_prismaNamespace = __esm({
  "prisma/@prisma/client/internal/prismaNamespace.ts"() {
    runtime2__namespace.Extensions.getExtensionContext;
    ({
      DbNull: runtime2__namespace.NullTypes.DbNull,
      JsonNull: runtime2__namespace.NullTypes.JsonNull,
      AnyNull: runtime2__namespace.NullTypes.AnyNull
    });
    runtime2__namespace.makeStrictEnum({
      ReadUncommitted: "ReadUncommitted",
      ReadCommitted: "ReadCommitted",
      RepeatableRead: "RepeatableRead",
      Serializable: "Serializable"
    });
    runtime2__namespace.Extensions.defineExtension;
  }
});

// prisma/@prisma/client/enums.ts
var UserRole, EventStatus;
var init_enums = __esm({
  "prisma/@prisma/client/enums.ts"() {
    UserRole = {
      ADMIN: "ADMIN",
      PROMOTER: "PROMOTER",
      USER: "USER"
    };
    EventStatus = {
      PENDING: "PENDING",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      CANCELLED: "CANCELLED"
    };
  }
});
var PrismaClient;
var init_client = __esm({
  "prisma/@prisma/client/client.ts"() {
    init_class();
    init_prismaNamespace();
    init_enums();
    init_enums();
    globalThis["__dirname"] = path__namespace.dirname(url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('server.js', document.baseURI).href))));
    PrismaClient = getPrismaClientClass();
  }
});
var connectionString, pool, adapter, prisma;
var init_prisma = __esm({
  "src/database/prisma.ts"() {
    init_client();
    connectionString = process.env.DATABASE_URL;
    pool = new pg.Pool({ connectionString });
    adapter = new adapterPg.PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
});

// src/utils/exceptions/http.ts
var HttpError, HttpUnauthorized, HttpNotFound, HttpBadRequest, HttpForbidden;
var init_http = __esm({
  "src/utils/exceptions/http.ts"() {
    HttpError = class extends Error {
      constructor(message, statusCode = 500) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    HttpUnauthorized = class extends HttpError {
      constructor(message = "N\xE3o autorizado") {
        super(message, 401);
        this.name = "HttpUnauthorized";
      }
    };
    HttpNotFound = class extends HttpError {
      constructor(message = "N\xE3o encontrado") {
        super(message, 404);
        this.name = "HttpNotFound";
      }
    };
    HttpBadRequest = class extends HttpError {
      constructor(message = "Requisi\xE7\xE3o inv\xE1lida") {
        super(message, 400);
        this.name = "HttpBadRequest";
      }
    };
    HttpForbidden = class extends HttpError {
      constructor(message = "Acesso negado") {
        super(message, 403);
        this.name = "HttpForbidden";
      }
    };
  }
});
function base64url(input) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: ttlSeconds * 1e3
  };
}
function parseCookie(header, name) {
  if (!header) return void 0;
  const parts = header.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return void 0;
}
var ttlSeconds, checkperiod, absoluteTtlSeconds, RefreshTokenService, refreshTokenService;
var init_RefreshTokenService = __esm({
  "src/services/RefreshTokenService.ts"() {
    ttlSeconds = Number(process.env.REFRESH_TOKEN_TIMEOUT || 60 * 60 * 3);
    checkperiod = Number(process.env.REFRESH_TOKEN_CHECKPERIOD || ttlSeconds + 1);
    absoluteTtlSeconds = Number(process.env.REFRESH_TOKEN_ABSOLUTE_TTL || 0);
    RefreshTokenService = class {
      cache = new NodeCache__default.default({ stdTTL: ttlSeconds, checkperiod });
      generate(userId) {
        const token = base64url(crypto.randomBytes(48));
        const now = Date.now();
        const entry = {
          userId: String(userId),
          familyId: crypto.randomUUID(),
          familyStartedAt: now,
          createdAt: now
        };
        this.cache.set(token, entry, ttlSeconds);
        return token;
      }
      get(token) {
        if (!token) return void 0;
        const entry = this.cache.get(token);
        if (!entry) return void 0;
        if (absoluteTtlSeconds > 0 && entry.familyStartedAt + absoluteTtlSeconds * 1e3 <= Date.now()) {
          this.cache.del(token);
          return void 0;
        }
        return { userId: entry.userId };
      }
      rotate(oldToken) {
        const current = this.cache.get(oldToken);
        if (!current) return null;
        if (absoluteTtlSeconds > 0 && current.familyStartedAt + absoluteTtlSeconds * 1e3 <= Date.now()) {
          this.cache.del(oldToken);
          return null;
        }
        const newToken = base64url(crypto.randomBytes(48));
        const now = Date.now();
        const entry = {
          userId: current.userId,
          familyId: current.familyId,
          familyStartedAt: current.familyStartedAt,
          createdAt: now
        };
        this.cache.set(newToken, entry, ttlSeconds);
        this.cache.del(oldToken);
        return { newToken, record: { userId: current.userId } };
      }
      revoke(token) {
        if (!token) return;
        this.cache.del(token);
      }
      get ttl() {
        return ttlSeconds;
      }
    };
    refreshTokenService = new RefreshTokenService();
  }
});

// src/services/permissionService.ts
var PermissionServiceError, PermissionService;
var init_permissionService = __esm({
  "src/services/permissionService.ts"() {
    init_prisma();
    PermissionServiceError = class extends Error {
    };
    PermissionService = class {
      static async getUserPermissions(userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        if (!user) {
          return [];
        }
        return [user.role.toLowerCase()];
      }
      static async addUserPermissions(userId, permissionNames) {
        throw new PermissionServiceError("Funcionalidade n\xE3o implementada - modelos de permiss\xF5es n\xE3o est\xE3o no schema");
      }
      static async removeUserPermissions(userId, permissionNames) {
        throw new PermissionServiceError("Funcionalidade n\xE3o implementada - modelos de permiss\xF5es n\xE3o est\xE3o no schema");
      }
      static async addUserGroupPermission(userId, groupId) {
        throw new PermissionServiceError("Funcionalidade n\xE3o implementada - modelos de grupos n\xE3o est\xE3o no schema");
      }
      static async removeUserGroupPermission(userId, groupId) {
        throw new PermissionServiceError("Funcionalidade n\xE3o implementada - modelos de grupos n\xE3o est\xE3o no schema");
      }
    };
  }
});
var COOKIE_NAME, authRouter;
var init_authRouter = __esm({
  "src/routes/authRouter.ts"() {
    init_jwt();
    init_RefreshTokenService();
    init_permissionService();
    init_prisma();
    COOKIE_NAME = "refresh_token";
    authRouter = express.Router();
    authRouter.post("/refresh", async (req, res) => {
      const cookieHeader = req.headers.cookie;
      const current = parseCookie(cookieHeader, COOKIE_NAME);
      const rotated = current ? await refreshTokenService.rotate(current) : null;
      if (!rotated) {
        res.status(401).json({ message: "Refresh inv\xE1lido" });
        return;
      }
      const userId = String(rotated.record.userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          approvedAt: true
        }
      });
      if (!user) {
        res.status(401).json({ message: "Usu\xE1rio n\xE3o encontrado" });
        return;
      }
      const permissions = await PermissionService.getUserPermissions(userId);
      const accessToken = jsonwebtoken.sign({ id: userId }, authConfig.secret, {
        subject: userId,
        expiresIn: authConfig.expiresIn
      });
      res.cookie(COOKIE_NAME, rotated.newToken, getCookieOptions());
      res.status(200).json({
        token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvedAt: user.approvedAt
        },
        permissions
      });
      return;
    });
    authRouter.post("/sair", async (req, res) => {
      const cookieHeader = req.headers.cookie;
      const current = parseCookie(cookieHeader, COOKIE_NAME);
      await refreshTokenService.revoke(current);
      res.clearCookie(COOKIE_NAME, { ...getCookieOptions(), maxAge: 0 });
      res.status(204).send();
      return;
    });
  }
});
var AuthenticationController;
var init_AuthenticationController = __esm({
  "src/controllers/AuthenticationController.ts"() {
    init_jwt();
    init_prisma();
    init_http();
    init_authRouter();
    init_RefreshTokenService();
    init_permissionService();
    AuthenticationController = class {
      // Registrar novo usuário
      async register(req, res, next) {
        const registerSchema = zod.z.object({
          name: zod.z.string({ message: "O nome deve ser em String" }).min(3, "Nome deve ter no m\xEDnimo 3 caracteres").trim(),
          email: zod.z.string({ message: "O email deve ser em String" }).email("Email inv\xE1lido").trim(),
          senha: zod.z.string({ message: "A senha deve ser em String" }).min(6, "Senha deve ter no m\xEDnimo 6 caracteres").max(20, "Senha deve ter no m\xE1ximo 20 caracteres").trim()
        });
        const { name, email, senha } = registerSchema.parse(req.body);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new HttpBadRequest("Email j\xE1 cadastrado");
        }
        const hashedPassword = await bcrypt.hash(senha, 10);
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "USER"
            // Role padrão
          }
        });
        const token = jsonwebtoken.sign({ id: user.id, email: user.email }, authConfig.secret, { subject: String(user.id), expiresIn: authConfig.expiresIn });
        const refresh = refreshTokenService.generate(user.id);
        res.cookie(COOKIE_NAME, refresh, getCookieOptions());
        const permissions = await PermissionService.getUserPermissions(user.id);
        res.status(201).json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            approvedAt: user.approvedAt
          },
          permissions
        });
      }
      async index(req, res, next) {
        const authSchema = zod.z.object({
          email: zod.z.string({ message: "O email deve ser em String" }).email().trim(),
          senha: zod.z.string({ message: "A senha deve ser em String" }).min(6).max(20).trim()
        });
        const { email, senha } = authSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new HttpUnauthorized("Usu\xE1rio ou senha inv\xE1lidos");
        }
        const passwordMatch = await bcrypt.compare(senha, user.password);
        if (!passwordMatch) {
          throw new HttpUnauthorized("Usu\xE1rio ou senha inv\xE1lidos");
        }
        const token = jsonwebtoken.sign({ id: user.id, email: user.email }, authConfig.secret, { subject: String(user.id), expiresIn: authConfig.expiresIn });
        const refresh = refreshTokenService.generate(user.id);
        res.cookie(COOKIE_NAME, refresh, getCookieOptions());
        const permissions = await PermissionService.getUserPermissions(user.id);
        res.status(200).json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            approvedAt: user.approvedAt
            // Importante para promoters verificarem se estão aprovados
          },
          permissions
        });
      }
    };
  }
});
var authenticationRouter, authenticationController;
var init_authenticationRouter = __esm({
  "src/routes/authenticationRouter.ts"() {
    init_AuthenticationController();
    authenticationRouter = express.Router();
    authenticationController = new AuthenticationController();
    authenticationRouter.post("/registrar", authenticationController.register);
    authenticationRouter.post("/", authenticationController.index);
  }
});
var EventController;
var init_EventController = __esm({
  "src/controllers/EventController.ts"() {
    init_prisma();
    init_http();
    EventController = class {
      // Criar evento (apenas promoters aprovados)
      async create(req, res, next) {
        const eventSchema = zod.z.object({
          title: zod.z.string().min(3, "T\xEDtulo deve ter no m\xEDnimo 3 caracteres"),
          description: zod.z.string().min(10, "Descri\xE7\xE3o deve ter no m\xEDnimo 10 caracteres"),
          location: zod.z.string().min(3, "Localiza\xE7\xE3o \xE9 obrigat\xF3ria"),
          startDate: zod.z.string().datetime(),
          endDate: zod.z.string().datetime(),
          imageUrl: zod.z.string().url().optional(),
          requiresRegistration: zod.z.boolean().default(true)
        });
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true, approvedAt: true }
        });
        if (!user) {
          throw new HttpNotFound("Usu\xE1rio n\xE3o encontrado");
        }
        if (user.role !== "PROMOTER") {
          throw new HttpForbidden("Apenas promoters podem criar eventos");
        }
        if (!user.approvedAt) {
          throw new HttpForbidden("Promoter n\xE3o aprovado");
        }
        const data = eventSchema.parse(req.body);
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (endDate <= startDate) {
          throw new HttpBadRequest("Data de t\xE9rmino deve ser posterior \xE0 data de in\xEDcio");
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
            status: "PENDING"
          }
        });
        res.status(201).json(event);
      }
      // Listar eventos (público - apenas aprovados)
      async index(req, res, next) {
        const querySchema = zod.z.object({
          promoterId: zod.z.string().uuid().optional(),
          page: zod.z.string().optional().transform((val) => val ? parseInt(val) : 1),
          limit: zod.z.string().optional().transform((val) => val ? parseInt(val) : 10)
        });
        const query = querySchema.parse(req.query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const where = {
          status: "APPROVED"
        };
        if (query.promoterId) {
          where.promoterId = query.promoterId;
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
              startDate: "asc"
            },
            skip,
            take: limit
          }),
          prisma.event.count({ where })
        ]);
        res.status(200).json({
          events,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
      // Buscar evento específico (público - apenas aprovados)
      async show(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const { id } = paramsSchema.parse(req.params);
        const event = await prisma.event.findFirst({
          where: {
            id,
            status: "APPROVED"
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
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        res.status(200).json(event);
      }
      // Atualizar evento (apenas promoter dono)
      async update(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const eventSchema = zod.z.object({
          title: zod.z.string().min(3, "T\xEDtulo deve ter no m\xEDnimo 3 caracteres").optional(),
          description: zod.z.string().min(10, "Descri\xE7\xE3o deve ter no m\xEDnimo 10 caracteres").optional(),
          location: zod.z.string().min(3, "Localiza\xE7\xE3o \xE9 obrigat\xF3ria").optional(),
          startDate: zod.z.string().datetime().optional(),
          endDate: zod.z.string().datetime().optional(),
          imageUrl: zod.z.string().url().optional().nullable(),
          requiresRegistration: zod.z.boolean().optional()
        });
        const { id } = paramsSchema.parse(req.params);
        const data = eventSchema.parse(req.body);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const event = await prisma.event.findUnique({
          where: { id },
          select: { promoterId: true, status: true }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        if (event.promoterId !== req.user.id) {
          throw new HttpForbidden("Apenas o promoter dono pode atualizar o evento");
        }
        const updateData = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.location) updateData.location = data.location;
        if (data.imageUrl !== void 0) updateData.imageUrl = data.imageUrl;
        if (data.requiresRegistration !== void 0) updateData.requiresRegistration = data.requiresRegistration;
        if (data.startDate) {
          updateData.startDate = new Date(data.startDate);
        }
        if (data.endDate) {
          updateData.endDate = new Date(data.endDate);
        }
        if (updateData.startDate && updateData.endDate) {
          if (updateData.endDate <= updateData.startDate) {
            throw new HttpBadRequest("Data de t\xE9rmino deve ser posterior \xE0 data de in\xEDcio");
          }
        } else if (data.startDate || data.endDate) {
          const currentEvent = await prisma.event.findUnique({
            where: { id },
            select: { startDate: true, endDate: true }
          });
          const startDate = updateData.startDate || currentEvent?.startDate;
          const endDate = updateData.endDate || currentEvent?.endDate;
          if (startDate && endDate && endDate <= startDate) {
            throw new HttpBadRequest("Data de t\xE9rmino deve ser posterior \xE0 data de in\xEDcio");
          }
        }
        if (event.status === "APPROVED") {
          updateData.status = "PENDING";
          updateData.approvedBy = null;
          updateData.approvedAt = null;
          updateData.rejectionReason = null;
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
        });
        res.status(200).json(updatedEvent);
      }
      // Aprovar evento (apenas admin)
      async approve(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const { id } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem aprovar eventos");
        }
        const event = await prisma.event.findUnique({
          where: { id }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        const updatedEvent = await prisma.event.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedBy: req.user.id,
            approvedAt: /* @__PURE__ */ new Date()
          }
        });
        res.status(200).json(updatedEvent);
      }
      // Rejeitar evento (apenas admin)
      async reject(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const bodySchema = zod.z.object({
          rejectionReason: zod.z.string().min(5, "Motivo da rejei\xE7\xE3o \xE9 obrigat\xF3rio")
        });
        const { id } = paramsSchema.parse(req.params);
        const { rejectionReason } = bodySchema.parse(req.body);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem rejeitar eventos");
        }
        const event = await prisma.event.findUnique({
          where: { id }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        const updatedEvent = await prisma.event.update({
          where: { id },
          data: {
            status: "REJECTED",
            approvedBy: req.user.id,
            approvedAt: /* @__PURE__ */ new Date(),
            rejectionReason
          }
        });
        res.status(200).json(updatedEvent);
      }
      // Cancelar evento (apenas o promoter dono)
      async cancel(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const { id } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const event = await prisma.event.findUnique({
          where: { id },
          select: { promoterId: true, status: true }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        if (event.promoterId !== req.user.id) {
          throw new HttpForbidden("Apenas o promoter dono pode cancelar o evento");
        }
        if (event.status === "CANCELLED") {
          throw new HttpBadRequest("Evento j\xE1 est\xE1 cancelado");
        }
        const updatedEvent = await prisma.event.update({
          where: { id },
          data: {
            status: "CANCELLED"
          }
        });
        res.status(200).json(updatedEvent);
      }
      // Listar eventos do promoter autenticado (todos os status)
      async myEvents(req, res, next) {
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const querySchema = zod.z.object({
          status: zod.z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
          page: zod.z.string().optional().transform((val) => val ? parseInt(val) : 1),
          limit: zod.z.string().optional().transform((val) => val ? parseInt(val) : 10)
        });
        const query = querySchema.parse(req.query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const where = {
          promoterId: req.user.id
        };
        if (query.status) {
          where.status = query.status;
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
              createdAt: "desc"
            },
            skip,
            take: limit
          }),
          prisma.event.count({ where })
        ]);
        res.status(200).json({
          events,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
      // Listar eventos pendentes (apenas admin)
      async pendingEvents(req, res, next) {
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem ver eventos pendentes");
        }
        const querySchema = zod.z.object({
          page: zod.z.string().optional().transform((val) => val ? parseInt(val) : 1),
          limit: zod.z.string().optional().transform((val) => val ? parseInt(val) : 10)
        });
        const query = querySchema.parse(req.query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const where = {
          status: "PENDING"
        };
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
              createdAt: "asc"
            },
            skip,
            take: limit
          }),
          prisma.event.count({ where })
        ]);
        res.status(200).json({
          events,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
      // Revogar evento aprovado (apenas admin) - volta para pendente
      async revoke(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const { id } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem revogar eventos");
        }
        const event = await prisma.event.findUnique({
          where: { id }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        if (event.status !== "APPROVED") {
          throw new HttpBadRequest("Apenas eventos aprovados podem ser revogados");
        }
        const updatedEvent = await prisma.event.update({
          where: { id },
          data: {
            status: "PENDING",
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
        });
        res.status(200).json(updatedEvent);
      }
    };
  }
});
function authenticationHandler(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new HttpNotFound("Token n\xE3o fornecido");
  }
  try {
    let token;
    if (Array.isArray(authHeader)) {
      token = authHeader[0] ?? "";
    } else {
      token = authHeader;
    }
    token = token.trim();
    const bearerRe = /^(Bearer)\s+/i;
    if (bearerRe.test(token)) {
      token = token.replace(bearerRe, "").trim();
    }
    if (!token) {
      throw new HttpNotFound("Token n\xE3o fornecido");
    }
    const { sub: id, email } = jsonwebtoken.verify(token, authConfig.secret);
    req.user = {
      id: String(id),
      email: String(email)
    };
    return next();
  } catch (error) {
    throw new HttpUnauthorized("Token inv\xE1lido");
  }
}
var init_AuthenticationHandler = __esm({
  "src/middlewares/AuthenticationHandler.ts"() {
    init_http();
    init_jwt();
  }
});

// src/middlewares/AuthontizationHandler.ts
function roleHandler(requiredRoles, userRoles, operator = "all") {
  const operation = operator === "all" ? requiredRoles.every.bind(requiredRoles) : requiredRoles.some.bind(requiredRoles);
  return operation((role) => userRoles.includes(role));
}
function authorizationHandler(roles, byPassRoles = ["admin"], operator = "all") {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
      }
      const userRoles = await PermissionService.getUserPermissions(req.user.id);
      const hasByPassRoles = roleHandler(byPassRoles, userRoles, "any");
      const hasRoles = roleHandler(roles, userRoles, operator);
      if (hasByPassRoles || hasRoles) {
        return next();
      }
      throw new HttpUnauthorized("Usu\xE1rio n\xE3o autorizado");
    } catch (error) {
      next(error);
    }
  };
}
var init_AuthontizationHandler = __esm({
  "src/middlewares/AuthontizationHandler.ts"() {
    init_permissionService();
    init_http();
  }
});
var eventRouter, eventController;
var init_eventRouter = __esm({
  "src/routes/eventRouter.ts"() {
    init_EventController();
    init_AuthenticationHandler();
    init_AuthontizationHandler();
    eventRouter = express.Router();
    eventController = new EventController();
    eventRouter.post("/", authenticationHandler, eventController.create);
    eventRouter.get("/meus", authenticationHandler, eventController.myEvents);
    eventRouter.get("/pendentes", authenticationHandler, authorizationHandler(["admin"]), eventController.pendingEvents);
    eventRouter.get("/", eventController.index);
    eventRouter.get("/:id", eventController.show);
    eventRouter.put("/:id", authenticationHandler, eventController.update);
    eventRouter.put("/:id/aprovar", authenticationHandler, authorizationHandler(["admin"]), eventController.approve);
    eventRouter.put("/:id/rejeitar", authenticationHandler, authorizationHandler(["admin"]), eventController.reject);
    eventRouter.put("/:id/revogar", authenticationHandler, authorizationHandler(["admin"]), eventController.revoke);
    eventRouter.put("/:id/cancelar", authenticationHandler, eventController.cancel);
  }
});
var PromoterController;
var init_PromoterController = __esm({
  "src/controllers/PromoterController.ts"() {
    init_prisma();
    init_http();
    init_enums();
    PromoterController = class {
      // Solicitar se tornar promoter (usuário autenticado)
      async request(req, res, next) {
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true, approvedAt: true }
        });
        if (!user) {
          throw new HttpNotFound("Usu\xE1rio n\xE3o encontrado");
        }
        if (user.role === "PROMOTER") {
          if (user.approvedAt) {
            throw new HttpForbidden("Voc\xEA j\xE1 \xE9 um promoter aprovado");
          } else {
            throw new HttpForbidden("Sua solicita\xE7\xE3o de promoter j\xE1 est\xE1 pendente de aprova\xE7\xE3o");
          }
        }
        if (user.role === "ADMIN") {
          throw new HttpForbidden("Administradores n\xE3o podem se tornar promoters");
        }
        const updatedUser = await prisma.user.update({
          where: { id: req.user.id },
          data: {
            role: "PROMOTER",
            approvedAt: null,
            // Pendente de aprovação
            approvedBy: null
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            approvedAt: true
          }
        });
        res.status(200).json({
          message: "Solicita\xE7\xE3o de promoter enviada com sucesso. Aguarde aprova\xE7\xE3o de um administrador.",
          user: updatedUser
        });
      }
      // Listar promoters pendentes (apenas admin)
      async index(req, res, next) {
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem ver promoters pendentes");
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
            createdAt: "asc"
          }
        });
        res.status(200).json(promoters);
      }
      // Aprovar promoter (apenas admin)
      async approve(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const { id } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem aprovar promoters");
        }
        const promoter = await prisma.user.findUnique({
          where: { id },
          select: { role: true, approvedAt: true }
        });
        if (!promoter) {
          throw new HttpNotFound("Promoter n\xE3o encontrado");
        }
        if (promoter.role !== "PROMOTER") {
          throw new HttpForbidden("Usu\xE1rio n\xE3o \xE9 um promoter");
        }
        if (promoter.approvedAt) {
          throw new HttpForbidden("Promoter j\xE1 est\xE1 aprovado");
        }
        const updatedPromoter = await prisma.user.update({
          where: { id },
          data: {
            approvedAt: /* @__PURE__ */ new Date(),
            approvedBy: req.user.id
          },
          select: {
            id: true,
            name: true,
            email: true,
            approvedAt: true
          }
        });
        res.status(200).json(updatedPromoter);
      }
      // Rejeitar promoter (apenas admin) - remover role de promoter
      async reject(req, res, next) {
        const paramsSchema = zod.z.object({
          id: zod.z.string().uuid()
        });
        const { id } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const admin = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (admin?.role !== "ADMIN") {
          throw new HttpForbidden("Apenas administradores podem rejeitar promoters");
        }
        const promoter = await prisma.user.findUnique({
          where: { id },
          select: { role: true }
        });
        if (!promoter) {
          throw new HttpNotFound("Promoter n\xE3o encontrado");
        }
        if (promoter.role !== "PROMOTER") {
          throw new HttpForbidden("Usu\xE1rio n\xE3o \xE9 um promoter");
        }
        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            role: "USER",
            approvedAt: null,
            approvedBy: null
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        res.status(200).json(updatedUser);
      }
    };
  }
});
var promoterRouter, promoterController;
var init_promoterRouter = __esm({
  "src/routes/promoterRouter.ts"() {
    init_PromoterController();
    init_AuthenticationHandler();
    init_AuthontizationHandler();
    promoterRouter = express.Router();
    promoterController = new PromoterController();
    promoterRouter.post("/solicitar", authenticationHandler, promoterController.request);
    promoterRouter.get("/pendentes", authenticationHandler, authorizationHandler(["admin"]), promoterController.index);
    promoterRouter.post("/:id/aprovar", authenticationHandler, authorizationHandler(["admin"]), promoterController.approve);
    promoterRouter.post("/:id/rejeitar", authenticationHandler, authorizationHandler(["admin"]), promoterController.reject);
  }
});
var EventRegistrationController;
var init_EventRegistrationController = __esm({
  "src/controllers/EventRegistrationController.ts"() {
    init_prisma();
    init_http();
    EventRegistrationController = class {
      // Inscrever-se em evento
      async create(req, res, next) {
        const bodySchema = zod.z.object({
          eventId: zod.z.string().uuid()
        });
        const { eventId } = bodySchema.parse(req.body);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: {
            id: true,
            status: true,
            requiresRegistration: true,
            startDate: true
          }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        if (event.status !== "APPROVED") {
          throw new HttpBadRequest("Evento n\xE3o est\xE1 aprovado");
        }
        if (!event.requiresRegistration) {
          throw new HttpBadRequest("Evento n\xE3o requer inscri\xE7\xE3o");
        }
        if (new Date(event.startDate) < /* @__PURE__ */ new Date()) {
          throw new HttpBadRequest("Evento j\xE1 iniciou");
        }
        const existingRegistration = await prisma.eventRegistration.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: req.user.id
            }
          }
        });
        if (existingRegistration) {
          throw new HttpBadRequest("Usu\xE1rio j\xE1 est\xE1 inscrito neste evento");
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
        });
        res.status(201).json(registration);
      }
      // Cancelar inscrição
      async delete(req, res, next) {
        const paramsSchema = zod.z.object({
          eventId: zod.z.string().uuid()
        });
        const { eventId } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const registration = await prisma.eventRegistration.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: req.user.id
            }
          }
        });
        if (!registration) {
          throw new HttpNotFound("Inscri\xE7\xE3o n\xE3o encontrada");
        }
        await prisma.eventRegistration.delete({
          where: {
            id: registration.id
          }
        });
        res.status(204).send();
      }
      // Listar eventos em que o usuário está inscrito
      async myRegistrations(req, res, next) {
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
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
            createdAt: "desc"
          }
        });
        res.status(200).json(registrations.map((r) => ({
          id: r.id,
          eventId: r.eventId,
          createdAt: r.createdAt,
          event: r.event
        })));
      }
      // Listar inscritos em evento (apenas promoter dono ou admin)
      async index(req, res, next) {
        const paramsSchema = zod.z.object({
          eventId: zod.z.string().uuid()
        });
        const { eventId } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: {
            id: true,
            promoterId: true
          }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        });
        if (user?.role !== "ADMIN" && event.promoterId !== req.user.id) {
          throw new HttpForbidden("Apenas o promoter dono ou admin podem ver os inscritos");
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
            createdAt: "asc"
          }
        });
        res.status(200).json({
          eventId,
          total: registrations.length,
          registrations: registrations.map((r) => ({
            id: r.id,
            user: r.user,
            createdAt: r.createdAt
          }))
        });
      }
    };
  }
});
var eventRegistrationRouter, eventRegistrationController;
var init_eventRegistrationRouter = __esm({
  "src/routes/eventRegistrationRouter.ts"() {
    init_EventRegistrationController();
    init_AuthenticationHandler();
    eventRegistrationRouter = express.Router();
    eventRegistrationController = new EventRegistrationController();
    eventRegistrationRouter.get("/meus", authenticationHandler, eventRegistrationController.myRegistrations);
    eventRegistrationRouter.post("/", authenticationHandler, eventRegistrationController.create);
    eventRegistrationRouter.delete("/:eventId", authenticationHandler, eventRegistrationController.delete);
    eventRegistrationRouter.get("/:eventId/inscritos", authenticationHandler, eventRegistrationController.index);
  }
});
var SavedEventController;
var init_SavedEventController = __esm({
  "src/controllers/SavedEventController.ts"() {
    init_prisma();
    init_http();
    SavedEventController = class {
      // Salvar evento
      async create(req, res, next) {
        const bodySchema = zod.z.object({
          eventId: zod.z.string().uuid()
        });
        const { eventId } = bodySchema.parse(req.body);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: {
            id: true,
            status: true
          }
        });
        if (!event) {
          throw new HttpNotFound("Evento n\xE3o encontrado");
        }
        if (event.status !== "APPROVED") {
          throw new HttpBadRequest("Apenas eventos aprovados podem ser salvos");
        }
        const existingSaved = await prisma.savedEvent.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: req.user.id
            }
          }
        });
        if (existingSaved) {
          throw new HttpBadRequest("Evento j\xE1 est\xE1 salvo");
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
        });
        res.status(201).json(savedEvent);
      }
      // Remover evento salvo
      async delete(req, res, next) {
        const paramsSchema = zod.z.object({
          eventId: zod.z.string().uuid()
        });
        const { eventId } = paramsSchema.parse(req.params);
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
        }
        const savedEvent = await prisma.savedEvent.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: req.user.id
            }
          }
        });
        if (!savedEvent) {
          throw new HttpNotFound("Evento n\xE3o est\xE1 salvo");
        }
        await prisma.savedEvent.delete({
          where: {
            id: savedEvent.id
          }
        });
        res.status(204).send();
      }
      // Listar eventos salvos do usuário
      async index(req, res, next) {
        if (!req.user?.id) {
          throw new HttpUnauthorized("Usu\xE1rio n\xE3o autenticado");
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
            createdAt: "desc"
          }
        });
        res.status(200).json(savedEvents);
      }
    };
  }
});
var savedEventRouter, savedEventController;
var init_savedEventRouter = __esm({
  "src/routes/savedEventRouter.ts"() {
    init_SavedEventController();
    init_AuthenticationHandler();
    savedEventRouter = express.Router();
    savedEventController = new SavedEventController();
    savedEventRouter.post("/", authenticationHandler, savedEventController.create);
    savedEventRouter.delete("/:eventId", authenticationHandler, savedEventController.delete);
    savedEventRouter.get("/", authenticationHandler, savedEventController.index);
  }
});

// src/controllers/AdminStatsController.ts
function getMonthNumber(monthName) {
  const months = {
    janeiro: 1,
    fevereiro: 2,
    mar\u00E7o: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12
  };
  return months[monthName.toLowerCase()] || 1;
}
var AdminStatsController;
var init_AdminStatsController = __esm({
  "src/controllers/AdminStatsController.ts"() {
    init_prisma();
    init_enums();
    AdminStatsController = class {
      async index(req, res, next) {
        try {
          const totalInscritos = await prisma.eventRegistration.count();
          const totalEventos = await prisma.event.count();
          const eventosPorStatusRaw = await prisma.event.groupBy({
            by: ["status"],
            _count: {
              id: true
            }
          });
          const eventosPorStatus = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            CANCELLED: 0
          };
          eventosPorStatusRaw.forEach((item) => {
            eventosPorStatus[item.status] = item._count.id;
          });
          const trintaDiasAtras = /* @__PURE__ */ new Date();
          trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
          const totalUsuariosAtivos = await prisma.user.count({
            where: {
              updatedAt: {
                gte: trintaDiasAtras
              }
            }
          });
          const totalUsuarios = await prisma.user.count();
          const totalPromoters = await prisma.user.count({
            where: {
              role: UserRole.PROMOTER
            }
          });
          const promotersPendentes = await prisma.user.count({
            where: {
              role: UserRole.PROMOTER,
              approvedAt: null
            }
          });
          const promotersAprovados = await prisma.user.count({
            where: {
              role: UserRole.PROMOTER,
              approvedAt: {
                not: null
              }
            }
          });
          const locaisMaisPopularesRaw = await prisma.event.groupBy({
            by: ["location"],
            _count: {
              id: true
            },
            where: {
              status: EventStatus.APPROVED
            },
            orderBy: {
              _count: {
                id: "desc"
              }
            },
            take: 10
          });
          const locaisMaisPopulares = await Promise.all(
            locaisMaisPopularesRaw.map(async (local) => {
              const eventosDoLocal = await prisma.event.findMany({
                where: {
                  location: local.location,
                  status: EventStatus.APPROVED
                },
                select: {
                  id: true
                }
              });
              const totalInscritosLocal = await prisma.eventRegistration.count({
                where: {
                  eventId: {
                    in: eventosDoLocal.map((e) => e.id)
                  }
                }
              });
              return {
                localizacao: local.location,
                totalEventos: local._count.id,
                totalInscritos: totalInscritosLocal
              };
            })
          );
          const eventosAprovados = eventosPorStatus.APPROVED;
          const eventosRejeitados = eventosPorStatus.REJECTED;
          const totalAvaliados = eventosAprovados + eventosRejeitados;
          const taxaAprovacaoEventos = totalAvaliados > 0 ? Number((eventosAprovados / totalAvaliados * 100).toFixed(2)) : 0;
          const promotersRejeitadosCount = 0;
          const totalPromotersAvaliados = promotersAprovados + promotersPendentes;
          const taxaAprovacaoPromoters = totalPromotersAvaliados > 0 && promotersAprovados > 0 ? Number((promotersAprovados / totalPromotersAvaliados * 100).toFixed(2)) : 0;
          const seisMesesAtras = /* @__PURE__ */ new Date();
          seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
          const eventosDetalhados = await prisma.event.findMany({
            where: {
              createdAt: {
                gte: seisMesesAtras
              }
            },
            select: {
              createdAt: true,
              status: true
            }
          });
          const eventosPorMesMap = /* @__PURE__ */ new Map();
          eventosDetalhados.forEach((evento) => {
            const mes = new Date(evento.createdAt).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric"
            });
            const stats = eventosPorMesMap.get(mes) || { total: 0, aprovados: 0, pendentes: 0 };
            stats.total++;
            if (evento.status === EventStatus.APPROVED) stats.aprovados++;
            if (evento.status === EventStatus.PENDING) stats.pendentes++;
            eventosPorMesMap.set(mes, stats);
          });
          const eventosPorMes = Array.from(eventosPorMesMap.entries()).map(([mes, stats]) => ({
            mes,
            ...stats
          })).sort((a, b) => {
            try {
              const [mesA, anoA] = a.mes.split(" ");
              const [mesB, anoB] = b.mes.split(" ");
              const dateA = new Date(parseInt(anoA), getMonthNumber(mesA) - 1);
              const dateB = new Date(parseInt(anoB), getMonthNumber(mesB) - 1);
              return dateA.getTime() - dateB.getTime();
            } catch {
              return 0;
            }
          }).slice(-6);
          const inscricoesDetalhadas = await prisma.eventRegistration.findMany({
            where: {
              createdAt: {
                gte: seisMesesAtras
              }
            },
            select: {
              createdAt: true
            }
          });
          const inscricoesPorMesMap = /* @__PURE__ */ new Map();
          inscricoesDetalhadas.forEach((inscricao) => {
            const mes = new Date(inscricao.createdAt).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric"
            });
            const total = inscricoesPorMesMap.get(mes) || 0;
            inscricoesPorMesMap.set(mes, total + 1);
          });
          const inscricoesPorMes = Array.from(inscricoesPorMesMap.entries()).map(([mes, total]) => ({
            mes,
            total
          })).sort((a, b) => {
            try {
              const [mesA, anoA] = a.mes.split(" ");
              const [mesB, anoB] = b.mes.split(" ");
              const dateA = new Date(parseInt(anoA), getMonthNumber(mesA) - 1);
              const dateB = new Date(parseInt(anoB), getMonthNumber(mesB) - 1);
              return dateA.getTime() - dateB.getTime();
            } catch {
              return 0;
            }
          }).slice(-6);
          res.status(200).json({
            totalInscritos,
            totalEventos,
            eventosPorStatus,
            totalUsuariosAtivos,
            totalUsuarios,
            totalPromoters,
            promotersPendentes,
            promotersAprovados,
            locaisMaisPopulares,
            taxaAceitacao: {
              eventos: {
                aprovados: eventosAprovados,
                rejeitados: eventosRejeitados,
                taxaAprovacao: taxaAprovacaoEventos
              },
              promoters: {
                aprovados: promotersAprovados,
                rejeitados: promotersRejeitadosCount,
                taxaAprovacao: taxaAprovacaoPromoters
              }
            },
            eventosPorMes,
            inscricoesPorMes
          });
        } catch (error) {
          console.error("Erro ao buscar estat\xEDsticas:", error);
          throw error;
        }
      }
    };
  }
});
var adminRouter, adminStatsController;
var init_adminRouter = __esm({
  "src/routes/adminRouter.ts"() {
    init_AdminStatsController();
    init_AuthenticationHandler();
    init_AuthontizationHandler();
    adminRouter = express.Router();
    adminStatsController = new AdminStatsController();
    adminRouter.get("/stats", authenticationHandler, authorizationHandler(["admin"]), adminStatsController.index);
  }
});
var router;
var init_routes = __esm({
  "src/routes/index.ts"() {
    init_authenticationRouter();
    init_eventRouter();
    init_promoterRouter();
    init_eventRegistrationRouter();
    init_savedEventRouter();
    init_adminRouter();
    router = express.Router();
    router.use("/entrar", authenticationRouter);
    router.use("/eventos", eventRouter);
    router.use("/promoters", promoterRouter);
    router.use("/inscricoes", eventRegistrationRouter);
    router.use("/eventos-salvos", savedEventRouter);
    router.use("/admin", adminRouter);
  }
});
function requestErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  } else if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message });
  } else if (err instanceof zod.ZodError) {
    return res.status(400).json({ message: "Erro de valida\xE7\xE3o", issues: err.issues });
  } else {
    return res.status(500).json({ message: "Erro interno do servidor: " + err.message });
  }
}
var init_requestErrorHandler = __esm({
  "src/middlewares/requestErrorHandler.ts"() {
    init_http();
  }
});
var app;
var init_app = __esm({
  "src/app.ts"() {
    init_routes();
    init_requestErrorHandler();
    app = express__default.default();
    app.use(cors__default.default());
    app.use(express__default.default.json());
    app.use("/api", router);
    app.use(requestErrorHandler);
  }
});

// src/server.ts
var require_server = __commonJS({
  "src/server.ts"() {
    init_app();
    var PORT = 3e3;
    app.listen(PORT, () => {
      console.log(`O servidor est\xE1 rodando em http://localhost:${PORT}`);
    });
  }
});
var server = require_server();

module.exports = server;
//# sourceMappingURL=server.js.map
//# sourceMappingURL=server.js.map