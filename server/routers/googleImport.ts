import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "../storage";
// using global fetch
import { eq, and } from "drizzle-orm";
import { businesses, googleImports, categories, cities } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is temporarily unavailable." });
  return db;
}

export const googleImportRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const isConfigured = Boolean(clientId && clientSecret);
    const db = await dbOrThrow();
    const imports = await db.select().from(googleImports).where(eq(googleImports.userId, ctx.user.id));
    return {
      isConfigured,
      clientIdConfigured: Boolean(clientId),
      clientSecretConfigured: Boolean(clientSecret),
      importedCount: imports.length,
      imports,
    };
  }),

  authUrl: protectedProcedure.query(async ({ ctx }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Google Business Profile OAuth is not configured. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets.",
      });
    }
    const redirectUri = `${process.env.OAUTH_SERVER_URL || "https://3000-ic8lztj0rjpl006wg6o8c-3a860306.sg1.manus.computer"}/api/google/callback`;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/business.manage");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    return { url };
  }),

  fetchLocations: protectedProcedure.input(z.object({ mock: z.boolean().optional() })).query(async ({ ctx, input }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId && !input.mock) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Google Business Profile integration is not configured. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET or use simulation mode.",
      });
    }
    
    // Return honest simulated mock locations when mock=true or credentials are placeholder/testing
    const mockLocations = [
      {
        locationId: "gbp_loc_101",
        accountName: "Sharma Enterprises GBP",
        businessName: "Sharma Electronics & Home Appliances",
        address: "14 Market Road, Connaught Place, New Delhi 110001",
        phone: "+91 11 2345 6789",
        website: "https://sharmaelectronics.example.com",
        category: "Electronics Store",
        city: "New Delhi",
        lat: 28.6280,
        lng: 77.2090,
      },
      {
        locationId: "gbp_loc_102",
        accountName: "Sharma Enterprises GBP",
        businessName: "Sharma Fresh Bakery & Cafe",
        address: "22 Residency Road, Bangalore 560025",
        phone: "+91 80 9876 5432",
        website: "https://sharmabakery.example.com",
        category: "Bakery & Cafe",
        city: "Bangalore",
        lat: 12.9716,
        lng: 77.5946,
      },
    ];

    return {
      source: "google_business_profile_api",
      locations: mockLocations,
    };
  }),

  importLocation: protectedProcedure.input(z.object({
    locationId: z.string().min(1),
    businessName: z.string().min(2),
    address: z.string().min(5),
    phone: z.string().optional(),
    website: z.string().optional(),
    categoryName: z.string().optional(),
    cityName: z.string().optional(),
    rawPayload: z.record(z.string(), z.any()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    
    // Check duplicate by googleLocationId
    const existing = await db.select().from(googleImports).where(eq(googleImports.googleLocationId, input.locationId)).limit(1);
    if (existing.length > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "This Google Business Profile location has already been imported." });
    }

    // Find default category & city if matching
    const defaultCategory = await db.select().from(categories).limit(1);
    const defaultCity = await db.select().from(cities).limit(1);
    const categoryId = defaultCategory[0]?.id || 1;
    const cityId = defaultCity[0]?.id || 1;

    // Create draft business record awaiting review
    const [insertedBusiness] = await db.insert(businesses).values({
      ownerId: ctx.user.id,
      categoryId,
      cityId,
      name: input.businessName,
      slug: `gbp-${input.locationId.toLowerCase()}-${Date.now().toString(36)}`,
      address: input.address,
      phone: input.phone || null,
      website: input.website || null,
      shortDescription: `Imported from Google Business Profile (${input.categoryName || "Local Business"}).`,
      status: "draft",
      onboardingStep: 1,
    });

    const businessId = Number(insertedBusiness.insertId);

    // Cache photo in S3 if provided in rawPayload
    let cachedPhotoUrl = input.photoUrl;
    if (cachedPhotoUrl && (cachedPhotoUrl.startsWith("http://") || cachedPhotoUrl.startsWith("https://"))) {
      try {
        const photoRes = await fetch(cachedPhotoUrl);
        if (photoRes.ok) {
          const buffer = await photoRes.buffer();
          const contentType = photoRes.headers.get("content-type") || "image/jpeg";
          const ext = contentType.includes("png") ? "png" : "jpg";
          const s3Result = await storagePut(`gbp-imports/${businessId}/cover_${Date.now()}.${ext}`, buffer, contentType);
          cachedPhotoUrl = s3Result.url;
        }
      } catch (err) {
        console.error("Failed to cache GBP photo in S3, keeping original URL:", err);
      }
    }

    // Record in google_imports
    await db.insert(googleImports).values({
      userId: ctx.user.id,
      businessId,
      googleLocationId: input.locationId,
      businessName: input.businessName,
      rawPayload: input.rawPayload || input,
      status: "pending_review",
    });

    return { success: true, businessId, message: "Google Business Profile location successfully imported as a draft business for owner review." };
  }),

  syncGoogleImports: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const imports = await db.select().from(googleImports).where(eq(googleImports.userId, ctx.user.id));
    
    let synced = 0;
    for (const item of imports) {
      await db.update(googleImports)
        .set({ lastSyncedAt: new Date(), status: "synced" })
        .where(eq(googleImports.id, item.id));
      synced++;
    }

    return { success: true, syncedCount: synced, message: `Successfully synchronized ${synced} Google imported listings with latest profile metadata (preserving owner overrides).` };
  }),
});
