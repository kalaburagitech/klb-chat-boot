import { mutation, query } from "./_generated/server";
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
      .query("chatbotRules")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
  },
});

export const createRule = mutation({
  args: {
    organizationSlug: v.string(),
    sessionId: v.string(),
    trigger: v.string(),
    type: v.string(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .first();

    if (!org) throw new Error("Organization not found");

    return await ctx.db.insert("chatbotRules", {
      organizationId: org._id,
      sessionId: args.sessionId,
      trigger: args.trigger,
      type: args.type,
      response: args.response,
      enabled: true,
    });
  },
});
