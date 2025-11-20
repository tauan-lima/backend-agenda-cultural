import 'dotenv/config';
import express, { NextFunction, Request, Response } from "express";
import "express-async-error"
import cors from "cors";
import { router } from "./routes";
import { requestErrorHandler } from "./middlewares/requestErrorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.use(requestErrorHandler);

export { app };
