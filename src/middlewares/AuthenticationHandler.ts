import { Request, Response, NextFunction } from "express";
import { HttpNotFound, HttpUnauthorized } from "@/utils/exceptions/http";
import { verify } from "jsonwebtoken";
import { authConfig } from "@/auth/jwt";

interface TokenPayload {
  sub: string;
  email: string;
}

export function authenticationHandler(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new HttpNotFound("Token não fornecido");
  }
  try {
    // Suporta "Bearer <token>" e também o token puro (compat)
    let token: string;
    if (Array.isArray(authHeader)) {
      token = authHeader[0] ?? "";
    } else {
      token = authHeader;
    }
    token = token.trim();
    const bearerRe = /^(Bearer)\s+/i;
    if (bearerRe.test(token)) {
      token = token.replace(bearerRe, '').trim();
    }
    if (!token) {
      throw new HttpNotFound("Token não fornecido");
    }

    const { sub: id, email } = verify(token, authConfig.secret) as TokenPayload;
    req.user = {
      id: String(id),
      email: String(email)
    }
    return next();
  } catch (error) {
    throw new HttpUnauthorized("Token inválido");
  }
}
