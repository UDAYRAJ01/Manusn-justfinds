import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getAdminCounts, getCategorySchemas, getOwnerBusinesses } from "../db";
import { canModerate } from "../domain/permissions";
import { protectedProcedure, router } from "../_core/trpc";

function requireModerator(role: "user" | "business_owner" | "admin" | "super_admin") {
  if (!canModerate(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
}

export const workspaceRouter = router({
  ownerOverview: protectedProcedure.query(async ({ ctx }) => {
    const businesses = await getOwnerBusinesses(ctx.user.id);
    return { businesses, ownerRole: ctx.user.role };
  }),
  categorySchemas: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getCategorySchemas();
  }),
  adminOverview: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getAdminCounts();
  }),
  bulkImportPreview: protectedProcedure.input(z.object({ filename: z.string().min(1).max(255) })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    return { filename: input.filename, status: "Pending" as const, message: "The upload interface is ready. A storage-backed parser and queue worker should be connected before processing source files." };
  }),
});
