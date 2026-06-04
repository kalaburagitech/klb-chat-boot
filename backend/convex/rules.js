"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = exports.getByOrg = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.getByOrg = (0, server_1.query)({
    args: { organizationSlug: values_1.v.string() },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
            .first();
        if (!org)
            return [];
        return await ctx.db
            .query("chatbotRules")
            .withIndex("by_org", (q) => q.eq("organizationId", org._id))
            .collect();
    },
});
exports.createRule = (0, server_1.mutation)({
    args: {
        organizationSlug: values_1.v.string(),
        sessionId: values_1.v.string(),
        trigger: values_1.v.string(),
        type: values_1.v.string(),
        response: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
            .first();
        if (!org)
            throw new Error("Organization not found");
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
