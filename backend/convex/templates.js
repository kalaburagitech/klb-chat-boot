"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getByOrg = void 0;
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
            .query("templates")
            .withIndex("by_org", (q) => q.eq("organizationId", org._id))
            .collect();
    },
});
exports.createTemplate = (0, server_1.mutation)({
    args: {
        organizationSlug: values_1.v.string(),
        name: values_1.v.string(),
        category: values_1.v.string(),
        content: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
            .first();
        if (!org)
            throw new Error("Organization not found");
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
exports.updateTemplate = (0, server_1.mutation)({
    args: {
        templateId: values_1.v.id("templates"),
        name: values_1.v.string(),
        category: values_1.v.string(),
        content: values_1.v.string(),
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
exports.deleteTemplate = (0, server_1.mutation)({
    args: { templateId: values_1.v.id("templates") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.templateId);
    },
});
