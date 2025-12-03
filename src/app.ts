import 'dotenv/config';
import express, { NextFunction, Request, Response } from "express";
import "express-async-error"
import cors from "cors";
import { router } from "./routes";
import { requestErrorHandler } from "./middlewares/requestErrorHandler";

const app = express();

// Configuração de CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Se não há origem (requisições de mesma origem, mobile, etc), permitir
    if (!origin) {
      return callback(null, true);
    }

    // Se CORS_ORIGINS está configurado, usar lista específica
    if (process.env.CORS_ORIGINS) {
      const allowedOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    }

    // Se não configurado, permitir todas as origens
    callback(null, true);
  },
  credentials: true, // Permitir cookies e credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // Cache preflight por 24 horas
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", router);

app.use(requestErrorHandler);

export { app };
