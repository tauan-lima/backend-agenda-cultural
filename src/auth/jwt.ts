import 'dotenv/config';
import { SignOptions } from "jsonwebtoken"

export const authConfig: {
  secret: string;
  expiresIn: SignOptions["expiresIn"];
} = {
  secret: process.env.JWT_PRIVATE_KEY || process.env.JWT_SECRET || "defaultSecret",
  expiresIn: (process.env.JWT_TIMEOUT || process.env.AUTH_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
}
