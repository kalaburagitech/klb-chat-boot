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
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
  },
});

export const createTemplate = mutation({
  args: {
    organizationSlug: v.string(),
    name: v.string(),
    category: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .first();

    if (!org) throw new Error("Organization not found");

    // Extract variables roughly (e.g. {{name}})
    const variables = args.content.match(/\{\{([^}]+)\}\}/g)?.map(v => v.replace(/[{}]/g, '')) || [];

    return await ctx.db.insert("templates", {
      organizationId: org._id,
      name: args.name,
      category: args.category,
      content: args.content,
      variables,
      active: true,
    });
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    name: v.string(),
    category: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Extract variables roughly (e.g. {{name}})
    const variables = args.content.match(/\{\{([^}]+)\}\}/g)?.map(v => v.replace(/[{}]/g, '')) || [];

    await ctx.db.patch(args.templateId, {
      name: args.name,
      category: args.category,
      content: args.content,
      variables,
    });
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
  },
});
