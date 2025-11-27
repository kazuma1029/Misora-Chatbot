import path from "node:path";
import express from "express";
import { setupMiddleware } from "./middleware";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";

async function startServer() {
  const app = express();

  // ミドルウェアの設定
  setupMiddleware(app);

  // APIルートの設定
  app.use("/api/user", userRoutes);
  app.use("/api/chat", chatRoutes);

  // 静的ファイルを返す（webディレクトリから）
  const webDir = path.join(__dirname, "../../web");
  app.use("/assets", express.static(path.join(webDir, "assets")));
  app.use("/dist", express.static(path.join(webDir, "dist")));
  app.use(express.static(path.join(webDir, "dist")));

  // ヒットしない場合は index.html を返す
  app.use("/:path", (_, res) => {
    res.sendFile(path.join(webDir, "index.html"));
  });
  app.get("/", (_, res) => {
    res.sendFile(path.join(webDir, "index.html"));
  });

  // graceful shutdown
  const signals = ["SIGTERM", "SIGINT"];
  for (const signal of signals) {
    process.on(signal, () => {
      console.info(
        `シグナル ${signal} を受信しました。サーバーを停止しています...`
      );
      process.exit(0);
    });
  }

  app.listen(5173, () => {
    console.log(`サーバーは 5173 で起動しています`);
  });

  return app;
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("サーバー起動中にエラーが発生しました:", err);
    process.exit(1);
  });
}
