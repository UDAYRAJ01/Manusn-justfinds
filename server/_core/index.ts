import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { generateRobotsTxt, generateSitemapXml } from "../domain/seo/sitemap";
import { appRouter } from "../routers";
import { processNextHighVolumeImportChunk } from "../routers/workspaces";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.post("/api/scheduled/process-high-volume-imports", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await processNextHighVolumeImportChunk();
      return res.json({ ok: true, result, timestamp: new Date().toISOString() });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The import processor failed.";
      console.error("[HighVolumeImport] scheduled processor failed", error);
      return res.status(500).json({ error: detail, timestamp: new Date().toISOString(), context: { url: req.originalUrl } });
    }
  });

  app.get("/robots.txt", async (_, res) => {
    res.type("text/plain");
    res.send(await generateRobotsTxt());
  });

  app.get("/sitemap.xml", async (_, res) => {
    res.type("application/xml");
    res.send(await generateSitemapXml());
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
