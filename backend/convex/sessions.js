"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionStatus = exports.initSession = exports.getSession = exports.deleteSession = exports.createSession = exports.getStats = exports.getAllSessions = exports.getByOrg = void 0;
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
            .query("whatsappSessions")
            .withIndex("by_org", (q) => q.eq("organizationId", org._id))
            .collect();
    },
});
exports.getAllSessions = (0, server_1.query)({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("whatsappSessions").collect();
    },
});
exports.getStats = (0, server_1.query)({
    args: { organizationSlug: values_1.v.string() },
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
exports.createSession = (0, server_1.mutation)({
    args: { organizationSlug: values_1.v.string(), name: values_1.v.string() },
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
        if (!org)
            throw new Error("Failed to create organization");
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
exports.deleteSession = (0, server_1.mutation)({
    args: { organizationSlug: values_1.v.string(), sessionId: values_1.v.string() },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
            .first();
        if (!org)
            throw new Error("Organization not found");
        const session = await ctx.db
            .query("whatsappSessions")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .first();
        if (session) {
            await ctx.db.delete(session._id);
        }
    },
});
exports.getSession = (0, server_1.query)({
    args: { sessionId: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("whatsappSessions")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .first();
    },
});
exports.initSession = (0, server_1.mutation)({
    args: { sessionId: values_1.v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("whatsappSessions")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .first();
        if (session) {
            await ctx.db.patch(session._id, { status: "INITIALIZING" });
        }
    },
});
exports.updateSessionStatus = (0, server_1.mutation)({
    args: {
        sessionId: values_1.v.string(),
        status: values_1.v.string(),
        qrCode: values_1.v.optional(values_1.v.string()),
        error: values_1.v.optional(values_1.v.string())
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("whatsappSessions")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .first();
        if (session) {
            const patch = {
                status: args.status,
                lastActive: Date.now()
            };
            if (args.qrCode !== undefined)
                patch.qrCode = args.qrCode;
            await ctx.db.patch(session._id, patch);
        }
    },
});
