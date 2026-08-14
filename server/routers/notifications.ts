import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { notifications, userNotificationPreferences } from "../../drizzle/schema";
import { eq, desc, and, count } from "drizzle-orm";

export const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), unreadOnly: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user.id;
      const unreadOnly = input?.unreadOnly ?? false;
      const limit = input?.limit ?? 20;

      const conditions = [eq(notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const items = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return items;
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const userId = ctx.user.id;

    const [res] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return { count: res?.count ?? 0 };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
    return { success: true };
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [pref] = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, ctx.user.id))
      .limit(1);

    if (!pref) {
      // create default
      await db.insert(userNotificationPreferences).values({
        userId: ctx.user.id,
      });
      const [newPref] = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, ctx.user.id))
        .limit(1);
      return newPref;
    }
    return pref;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        inAppEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        whatsappEnabled: z.boolean().optional(),
        notifyBusiness: z.boolean().optional(),
        notifyJobs: z.boolean().optional(),
        notifyLeads: z.boolean().optional(),
        notifyReviews: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = ctx.user.id;

      const [existing] = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId))
        .limit(1);

      if (!existing) {
        await db.insert(userNotificationPreferences).values({
          userId,
          ...input,
        });
      } else {
        await db
          .update(userNotificationPreferences)
          .set(input)
          .where(eq(userNotificationPreferences.userId, userId));
      }
      return { success: true };
    }),
});
