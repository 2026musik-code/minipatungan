import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import { getRequestListener } from "@hono/node-server";
import honoApp from "./src/worker";

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

const API_KEY = "cutad_98e7ba3c88fdfe5526740ed69f59fc71267f4a69";
const BASE_URL = "https://www.cutad.web.id/api/public";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(cors());

  // Use Hono for API routes
  const honoListener = getRequestListener(honoApp.fetch);
  
  app.all("/api/*", (req, res) => {
    honoListener(req, res);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
