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

// Função para verificar se origem é permitida
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Sem origem = permitir (Postman, mobile, etc)

  const allowedOrigins = getAllowedOrigins();

  // Se '*' está na lista, permitir todas as origens
  if (allowedOrigins.includes('*')) {
    return true;
  }

  // Verificar se a origem está na lista permitida
  return allowedOrigins.includes(origin);
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      // Com credentials: true, devemos retornar a origem exata, não '*'
      callback(null, origin || true);
    } else {
      console.warn(`CORS: Origem bloqueada: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
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

// Middleware adicional para garantir headers CORS em todas as respostas
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Se há origem e é permitida, adicionar headers CORS
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  }

  // Responder imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());

app.use("/api", router);

app.use(requestErrorHandler);

export { app };
