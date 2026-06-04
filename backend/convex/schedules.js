"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedule = exports.getByOrg = void 0;
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
            .query("schedules")
            .withIndex("by_org", (q) => q.eq("organizationId", org._id))
            .collect();
    },
});
exports.createSchedule = (0, server_1.mutation)({
    args: {
        organizationSlug: values_1.v.string(),
        name: values_1.v.string(),
        type: values_1.v.string(),
        targetGroup: values_1.v.string(),
        messageContent: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
            .first();
        if (!org)
            throw new Error("Organization not found");
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
