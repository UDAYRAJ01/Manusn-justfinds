import type { Express, Request } from "express";
import { and, eq } from "drizzle-orm";
import { bulkImportSourceChunks, bulkImports } from "../../drizzle/schema";
import { getDb } from "../db";
import { canModerate } from "../domain/permissions";
import { isSupportedImportFilename } from "../domain/highVolumeImportPolicy";
import { highVolumeUploadPartBytes, highVolumeUploadPartCount, highVolumeUploadPartIssue } from "../domain/highVolumeUploadPolicy";
import { storagePut } from "../storage";
import { sdk } from "./sdk";

async function readUploadBody(req: Request, expectedBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    req.on("data", (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > expectedBytes) {
        reject(new Error("The upload chunk exceeded its expected size."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks, receivedBytes)));
    req.on("error", reject);
    req.on("aborted", () => reject(new Error("The upload was interrupted before the chunk completed.")));
  });
}

function positiveInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function nonNegativeInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function registerHighVolumeUploadProxy(app: Express) {
  app.put("/api/admin/bulk-imports/:importId/upload/parts/:partNumber", async (req, res) => {
    try {
      const importId = positiveInteger(req.params.importId);
      const partNumber = nonNegativeInteger(req.params.partNumber);
      if (!importId || partNumber === null) return res.status(400).json({ error: "Invalid staged import or upload chunk." });

      const user = await sdk.authenticateRequest(req);
      if (!canModerate(user.role)) return res.status(403).json({ error: "Administrator access is required." });

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "The import service is temporarily unavailable." });
      const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, importId)).limit(1);
      if (!job) return res.status(404).json({ error: "Staged import not found." });
      if (job.initiatedById !== user.id && user.role !== "super_admin") return res.status(403).json({ error: "Only the initiating administrator may upload this file." });
      if (job.phase !== "staged" || job.sourceUploadedAt) return res.status(409).json({ error: "This import is no longer waiting for a file upload." });
      if (!job.sourceFileKey || !isSupportedImportFilename(job.filename)) return res.status(400).json({ error: "This staged import does not accept a spreadsheet file." });

      const expectedPartBytes = highVolumeUploadPartBytes(job.sourceFileSize, partNumber);
      const declaredBytes = Number(req.header("content-length"));
      const declaredIssue = highVolumeUploadPartIssue(job.sourceFileSize, partNumber, Number.isSafeInteger(declaredBytes) ? declaredBytes : null);
      if (declaredIssue) return res.status(400).json({ error: declaredIssue });
      if (!expectedPartBytes) return res.status(400).json({ error: "This upload chunk does not belong to the staged import." });

      const [existing] = await db.select().from(bulkImportSourceChunks).where(and(eq(bulkImportSourceChunks.importId, importId), eq(bulkImportSourceChunks.partNumber, partNumber))).limit(1);
      if (existing) {
        if (existing.byteSize !== expectedPartBytes) return res.status(409).json({ error: "A conflicting upload chunk already exists. Start a new import." });
      } else {
        const bytes = await readUploadBody(req, expectedPartBytes);
        const bodyIssue = highVolumeUploadPartIssue(job.sourceFileSize, partNumber, bytes.length);
        if (bodyIssue) return res.status(400).json({ error: bodyIssue });
        const contentType = job.sourceFileContentType || req.header("content-type") || "application/octet-stream";
        const stored = await storagePut(`${job.sourceFileKey}.part-${String(partNumber).padStart(6, "0")}`, bytes, contentType);
        await db.insert(bulkImportSourceChunks).values({ importId, partNumber, storageKey: stored.key, byteSize: bytes.length });
      }

      const parts = await db.select({ partNumber: bulkImportSourceChunks.partNumber, byteSize: bulkImportSourceChunks.byteSize }).from(bulkImportSourceChunks).where(eq(bulkImportSourceChunks.importId, importId));
      const totalParts = highVolumeUploadPartCount(job.sourceFileSize)!;
      const complete = parts.length === totalParts && parts.every(part => part.byteSize === highVolumeUploadPartBytes(job.sourceFileSize, part.partNumber));
      if (complete) await db.update(bulkImports).set({ sourceUploadedAt: new Date(), errorCategory: null, errorMessage: null }).where(eq(bulkImports.id, importId));
      return res.status(201).json({ ok: true, importId, partNumber, uploadedParts: parts.length, totalParts, complete });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The spreadsheet chunk could not be staged in secure storage.";
      console.error("[HighVolumeImport] chunked same-origin upload failed", error);
      return res.status(500).json({ error: detail });
    }
  });
}
