import type { Express, Request } from "express";
import { eq } from "drizzle-orm";
import { bulkImports } from "../../drizzle/schema";
import { getDb } from "../db";
import { canModerate } from "../domain/permissions";
import { isSupportedImportFilename } from "../domain/highVolumeImportPolicy";
import { highVolumeUploadIssue } from "../domain/highVolumeUploadPolicy";
import { storagePut } from "../storage";
import { sdk } from "./sdk";

async function readUploadBody(req: Request, expectedBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    req.on("data", (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > expectedBytes) {
        reject(new Error("The upload exceeded its staged file size."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks, receivedBytes)));
    req.on("error", reject);
    req.on("aborted", () => reject(new Error("The upload was interrupted before it completed.")));
  });
}

function numberParam(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function registerHighVolumeUploadProxy(app: Express) {
  app.put("/api/admin/bulk-imports/:importId/upload", async (req, res) => {
    try {
      const importId = numberParam(req.params.importId);
      if (!importId) return res.status(400).json({ error: "Invalid import identifier." });

      const user = await sdk.authenticateRequest(req);
      if (!canModerate(user.role)) return res.status(403).json({ error: "Administrator access is required." });

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "The import service is temporarily unavailable." });

      const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, importId)).limit(1);
      if (!job) return res.status(404).json({ error: "Staged import not found." });
      if (job.initiatedById !== user.id && user.role !== "super_admin") return res.status(403).json({ error: "Only the initiating administrator may upload this file." });
      if (job.phase !== "staged") return res.status(409).json({ error: "This import is no longer waiting for a file upload." });
      if (!job.sourceFileKey || !isSupportedImportFilename(job.filename)) return res.status(400).json({ error: "This staged import does not accept a spreadsheet file." });

      const declaredBytes = numberParam(req.header("content-length") ?? "");
      const uploadIssue = highVolumeUploadIssue(job.sourceFileSize, declaredBytes);
      if (uploadIssue) return res.status(400).json({ error: uploadIssue });

      const bytes = await readUploadBody(req, job.sourceFileSize!);
      const bodyIssue = highVolumeUploadIssue(job.sourceFileSize, bytes.length);
      if (bodyIssue) return res.status(400).json({ error: bodyIssue });

      const contentType = job.sourceFileContentType || req.header("content-type") || "application/octet-stream";
      const stored = await storagePut(job.sourceFileKey, bytes, contentType);
      await db.update(bulkImports).set({ sourceFileKey: stored.key, sourceFileSize: bytes.length, sourceFileContentType: contentType, sourceUploadedAt: new Date(), errorCategory: null, errorMessage: null }).where(eq(bulkImports.id, importId));

      return res.status(201).json({ ok: true, importId, bytes: bytes.length });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The spreadsheet could not be staged in secure storage.";
      console.error("[HighVolumeImport] same-origin upload failed", error);
      return res.status(500).json({ error: detail });
    }
  });
}
