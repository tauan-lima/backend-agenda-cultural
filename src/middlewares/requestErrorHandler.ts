import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/utils/exceptions/http';
import { ZodError } from 'zod';

export function requestErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Se headers já foram enviados, passar para o próximo handler
  if (res.headersSent) {
    return next(err);
  }

  // Se for erro de CORS, retornar com headers CORS
  if (err.message && err.message.includes('CORS')) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(403).json({ message: 'CORS: Origem não permitida' });
  }

  // Tratar outros tipos de erro
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message });
  } else if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', issues: err.issues });
  } else {
    console.error('Erro não tratado:', err);
    return res.status(500).json({ message: 'Erro interno do servidor: ' + err.message });
  }
}
