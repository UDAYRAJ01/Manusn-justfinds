import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { canManageBusiness } from "../domain/permissions";
import { customDomains, domainVerificationRecords, businesses } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const domainRouter = router({
  getByBusiness: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });
      
      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const allowed = canManageBusiness(ctx.user.role, ctx.user.id, business.ownerId);
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      const domains = await db
        .select()
        .from(customDomains)
        .where(eq(customDomains.businessId, input.businessId));
      
      const verificationRecords = await db
        .select()
        .from(domainVerificationRecords)
        .where(eq(domainVerificationRecords.businessId, input.businessId));

      return {
        domains,
        verificationRecords,
      };
    }),

  addDomain: protectedProcedure
    .input(z.object({
      businessId: z.number(),
      domain: z.string().min(3),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });

      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const allowed = canManageBusiness(ctx.user.role, ctx.user.id, business.ownerId);
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      let cleanDomain = input.domain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

      const existing = await db
        .select()
        .from(customDomains)
        .where(eq(customDomains.domain, cleanDomain))
        .limit(1);

      if (existing.length > 0) {
        if (existing[0].businessId === input.businessId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This domain is already connected to your business.",
          });
        }
        throw new TRPCError({
          code: "CONFLICT",
          message: "This domain is already connected to another Just Finds business.",
        });
      }

      const businessDomains = await db
        .select()
        .from(customDomains)
        .where(eq(customDomains.businessId, input.businessId));

      const isPrimary = businessDomains.length === 0;
      const verificationToken = `just-finds-verification=${Math.random().toString(36).substring(2, 12)}`;

      await db.insert(customDomains).values({
        businessId: input.businessId,
        domain: cleanDomain,
        domainType: cleanDomain.startsWith("www.") ? "subdomain" : "apex",
        isPrimary,
        verificationStatus: "pending",
        routingStatus: "pending",
        sslStatus: "not_configured",
      });

      await db.insert(domainVerificationRecords).values({
        businessId: input.businessId,
        domain: cleanDomain,
        verificationMethod: "txt",
        verificationToken,
        status: "pending",
      });

      return {
        success: true,
        domain: cleanDomain,
        verificationToken,
      };
    }),

  verifyDomain: protectedProcedure
    .input(z.object({
      businessId: z.number(),
      domainId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });

      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const allowed = canManageBusiness(ctx.user.role, ctx.user.id, business.ownerId);
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      const [domainRecord] = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, input.domainId), eq(customDomains.businessId, input.businessId)))
        .limit(1);

      if (!domainRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found." });
      }

      const newStatus = "verified";
      const routingStatus = "connected";
      const sslStatus = "active";

      await db
        .update(customDomains)
        .set({
          verificationStatus: newStatus,
          routingStatus,
          sslStatus,
          updatedAt: new Date(),
        })
        .where(eq(customDomains.id, input.domainId));

      await db
        .update(domainVerificationRecords)
        .set({
          status: "verified",
          verifiedAt: new Date(),
        })
        .where(and(eq(domainVerificationRecords.businessId, input.businessId), eq(domainVerificationRecords.domain, domainRecord.domain)));

      return {
        success: true,
        verificationStatus: newStatus,
        routingStatus,
        sslStatus,
      };
    }),

  setPrimary: protectedProcedure
    .input(z.object({
      businessId: z.number(),
      domainId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });

      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const allowed = canManageBusiness(ctx.user.role, ctx.user.id, business.ownerId);
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      await db
        .update(customDomains)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(customDomains.businessId, input.businessId));

      await db
        .update(customDomains)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(and(eq(customDomains.id, input.domainId), eq(customDomains.businessId, input.businessId)));

      return { success: true };
    }),

  removeDomain: protectedProcedure
    .input(z.object({
      businessId: z.number(),
      domainId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });

      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const allowed = canManageBusiness(ctx.user.role, ctx.user.id, business.ownerId);
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      const [target] = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, input.domainId), eq(customDomains.businessId, input.businessId)))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found." });
      }

      await db
        .delete(customDomains)
        .where(eq(customDomains.id, input.domainId));

      await db
        .delete(domainVerificationRecords)
        .where(and(eq(domainVerificationRecords.businessId, input.businessId), eq(domainVerificationRecords.domain, target.domain)));

      return { success: true };
    }),
});
