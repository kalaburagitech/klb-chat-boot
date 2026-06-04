import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByOrg = query({
  args: { organizationSlug: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .first();

    if (!org) return [];

    return await ctx.db
      .query("whatsappSessions")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
  },
});

export const getAllSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("whatsappSessions").collect();
  },
});

export const getStats = query({
  args: { organizationSlug: v.string() },
  handler: async (ctx, args) => {
    // For now, return placeholder stats until we build out the full analytics schema
    return {
      activeSessions: 1,
      messagesSent: 150,
      totalLeads: 25,
      aiReplies: "85%",
    };
  },
});

export const createSession = mutation({
  args: { organizationSlug: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .first();

    // Auto-seed the organization if it doesn't exist (for dev/migration)
    if (!org) {
      const orgId = await ctx.db.insert("organizations", {
        name: "KLB Connect",
        slug: args.organizationSlug,
        apiKey: "sk_" + Math.random().toString(36).substring(2),
        settings: {
          conversationTimeoutMinutes: 5,
          typingDelay: { min: 2000, max: 5000 },
        },
      });
      org = await ctx.db.get(orgId);
    }

    if (!org) throw new Error("Failed to create organization");

    const sessionId = Math.random().toString(36).substring(7);

    return await ctx.db.insert("whatsappSessions", {
      organizationId: org._id,
      sessionId,
      name: args.name,
      status: "INITIALIZING",
      lastActive: Date.now(),
      settings: {
        autoReply: true,
        aiEnabled: false,
        typingDelay: {
          min: 2000,
          max: 5000,
        },
      },
    });
  },
});

export const deleteSession = mutation({
  args: { organizationSlug: v.string(), sessionId: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .first();
    if (!org) throw new Error("Organization not found");

    const session = await ctx.db
      .query("whatsappSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whatsappSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const initSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("whatsappSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { status: "INITIALIZING" } as any);
    }
  },
});

export const updateSessionStatus = mutation({
  args: { 
    sessionId: v.string(), 
    status: v.string(), 
    qrCode: v.optional(v.string()), 
    error: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("whatsappSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      const patch: any = { 
        status: args.status, 
        lastActive: Date.now() 
      };
      if (args.qrCode !== undefined) patch.qrCode = args.qrCode;
      
      await ctx.db.patch(session._id, patch);
    }
  },
});
