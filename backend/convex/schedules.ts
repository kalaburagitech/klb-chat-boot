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
      .query("schedules")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
  },
});

export const createSchedule = mutation({
  args: {
    organizationSlug: v.string(),
    name: v.string(),
    type: v.string(),
    targetGroup: v.string(),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .first();

    if (!org) throw new Error("Organization not found");

    return await ctx.db.insert("schedules", {
      organizationId: org._id,
      name: args.name,
      type: args.type,
      targetGroup: args.targetGroup,
      messageContent: args.messageContent,
      active: true,
    });
  },
});
