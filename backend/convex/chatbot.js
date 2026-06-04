"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAnalytics = exports.getTemplate = exports.getRootMenu = exports.getMenu = exports.checkAutoReplyRules = exports.updateCustomerState = exports.getCustomerState = exports.getOrganization = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.getOrganization = (0, server_1.query)({
    args: { slugOrId: values_1.v.string() },
    handler: async (ctx, args) => {
        let org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
            .first();
        if (!org) {
            try {
                org = await ctx.db.get(args.slugOrId);
            }
            catch (e) { }
        }
        return org;
    }
});
exports.getCustomerState = (0, server_1.mutation)({
    args: {
        organizationId: values_1.v.id("organizations"),
        phoneNumber: values_1.v.string(),
        sessionId: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        let state = await ctx.db
            .query("customerStates")
            .withIndex("by_org_phone_session", (q) => q.eq("organizationId", args.organizationId)
            .eq("phoneNumber", args.phoneNumber)
            .eq("sessionId", args.sessionId))
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
exports.updateCustomerState = (0, server_1.mutation)({
    args: {
        stateId: values_1.v.id("customerStates"),
        conversationState: values_1.v.string(),
        activeMenuId: values_1.v.optional(values_1.v.id("menus")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.stateId, {
            conversationState: args.conversationState,
            activeMenuId: args.activeMenuId,
        });
    }
});
exports.checkAutoReplyRules = (0, server_1.query)({
    args: {
        organizationId: values_1.v.id("organizations"),
        text: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const rules = await ctx.db
            .query("chatbotRules")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("enabled"), true))
            .collect();
        return rules.find(rule => 
        // Simplified match logic for exact/includes
        rule.trigger.toLowerCase() === args.text || args.text.includes(rule.trigger.toLowerCase()));
    }
});
exports.getMenu = (0, server_1.query)({
    args: { menuId: values_1.v.id("menus") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.menuId);
    }
});
exports.getRootMenu = (0, server_1.query)({
    args: { organizationId: values_1.v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("menus")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("isRoot"), true))
            .filter((q) => q.eq(q.field("active"), true))
            .first();
    }
});
exports.getTemplate = (0, server_1.query)({
    args: { templateId: values_1.v.id("templates") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.templateId);
    }
});
exports.logAnalytics = (0, server_1.mutation)({
    args: {
        organizationId: values_1.v.id("organizations"),
        phoneNumber: values_1.v.string(),
        sessionId: values_1.v.string(),
        event: values_1.v.string(),
        metadata: values_1.v.optional(values_1.v.any()),
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
