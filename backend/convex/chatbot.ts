import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrganization = query({
  args: { slugOrId: v.string() },
  handler: async (ctx, args) => {
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
      .first();
    
    if (!org) {
      try {
        org = await ctx.db.get(args.slugOrId as any) as any;
      } catch (e) {}
    }
    return org;
  }
});

export const getCustomerState = mutation({
  args: {
    organizationId: v.id("organizations"),
    phoneNumber: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    let state = await ctx.db
      .query("customerStates")
      .withIndex("by_org_phone_session", (q) => 
        q.eq("organizationId", args.organizationId)
         .eq("phoneNumber", args.phoneNumber)
         .eq("sessionId", args.sessionId)
      )
      .first();

    let isNewSession = false;
    if (!state) {
      const stateId = await ctx.db.insert("customerStates", {
        organizationId: args.organizationId,
        phoneNumber: args.phoneNumber,
        sessionId: args.sessionId,
        conversationState: 'MAIN_MENU'
      });
      state = await ctx.db.get(stateId);
      isNewSession = true;
    }

    return { state, isNewSession };
  }
});

export const updateCustomerState = mutation({
  args: {
    stateId: v.id("customerStates"),
    conversationState: v.string(),
    activeMenuId: v.optional(v.id("menus")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.stateId, {
      conversationState: args.conversationState,
      activeMenuId: args.activeMenuId,
    });
  }
});

export const checkAutoReplyRules = query({
  args: {
    organizationId: v.id("organizations"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("chatbotRules")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();

    return rules.find(rule => 
      // Simplified match logic for exact/includes
      rule.trigger.toLowerCase() === args.text || args.text.includes(rule.trigger.toLowerCase())
    );
  }
});

export const getMenu = query({
  args: { menuId: v.id("menus") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.menuId);
  }
});

export const getRootMenu = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("menus")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("isRoot"), true))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
  }
});

export const getTemplate = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  }
});

export const logAnalytics = mutation({
  args: {
    organizationId: v.id("organizations"),
    phoneNumber: v.string(),
    sessionId: v.string(),
    event: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analyticsLogs", {
      organizationId: args.organizationId,
      phoneNumber: args.phoneNumber,
      sessionId: args.sessionId,
      event: args.event,
      metadata: args.metadata,
    });
  }
});
