import express from "express";
import helmet from "helmet";
import morgan from "morgan";

export function setupMiddleware(app: express.Application): void {
  // ボディパーサー
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // セキュリティミドルウェア
  app.use(helmet());

  // ログミドルウェア
  app.use(morgan("short"));
}

export default setupMiddleware;
