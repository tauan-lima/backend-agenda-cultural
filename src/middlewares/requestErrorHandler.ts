import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/utils/exceptions/http';
import { ZodError } from 'zod';

export function requestErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  } else if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message });
  } else if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', issues: err.issues });
  } else {
    return res.status(500).json({ message: 'Erro interno do servidor: ' + err.message });
  }
}
