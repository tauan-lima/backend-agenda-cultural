import 'dotenv/config';
import express, { NextFunction, Request, Response } from "express";
import "express-async-error"
import cors from "cors";
import { router } from "./routes";
import { requestErrorHandler } from "./middlewares/requestErrorHandler";

const app = express();

// Configuração de CORS - deve ser o primeiro middleware
// Lista de origens permitidas (pode ser configurada via variável de ambiente)
const getAllowedOrigins = (): string[] => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  }
  // Por padrão, permitir todas as origens (desenvolvimento)
  // Em produção, configure CORS_ORIGINS com as origens específicas
  return ['*'];
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Se não há origem (requisições de mesma origem, mobile, Postman, etc), permitir
    if (!origin) {
      return callback(null, true);
    }

    // Se '*' está na lista, permitir todas as origens
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Verificar se a origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origem não permitida
    console.warn(`CORS: Origem bloqueada: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Permitir cookies e credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // Cache preflight por 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Aplicar CORS antes de tudo
app.use(cors(corsOptions));

app.use(express.json());

app.use("/api", router);

app.use(requestErrorHandler);

export { app };
