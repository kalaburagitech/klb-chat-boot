"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    organizations: (0, server_1.defineTable)({
        name: values_1.v.string(),
        slug: values_1.v.string(),
        apiKey: values_1.v.string(),
        settings: values_1.v.object({
            conversationTimeoutMinutes: values_1.v.number(),
            typingDelay: values_1.v.object({
                min: values_1.v.number(),
                max: values_1.v.number(),
            }),
        }),
    }).index("by_slug", ["slug"]).index("by_apiKey", ["apiKey"]),
    templates: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        name: values_1.v.string(),
        category: values_1.v.string(),
        content: values_1.v.string(),
        variables: values_1.v.array(values_1.v.string()),
        active: values_1.v.boolean(),
    }).index("by_org", ["organizationId"]),
    whatsappSessions: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        sessionId: values_1.v.string(),
        phoneNumber: values_1.v.optional(values_1.v.string()),
        name: values_1.v.string(),
        qrCode: values_1.v.optional(values_1.v.string()),
        status: values_1.v.string(),
        lastActive: values_1.v.number(), // timestamp
        settings: values_1.v.object({
            autoReply: values_1.v.boolean(),
            aiEnabled: values_1.v.boolean(),
            typingDelay: values_1.v.object({
                min: values_1.v.number(),
                max: values_1.v.number(),
            }),
        }),
    }).index("by_org", ["organizationId"]).index("by_sessionId", ["sessionId"]),
    menus: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        title: values_1.v.string(),
        content: values_1.v.string(),
        options: values_1.v.array(values_1.v.object({
            keyword: values_1.v.string(),
            label: values_1.v.string(),
            action: values_1.v.string(), // 'NEXT_MENU' | 'SEND_TEMPLATE' | 'TRIGGER_FLOW'
            targetId: values_1.v.optional(values_1.v.string()),
        })),
        parentMenuId: values_1.v.optional(values_1.v.id("menus")),
        isRoot: values_1.v.boolean(),
        active: values_1.v.boolean(),
    }).index("by_org", ["organizationId"]),
    schedules: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        name: values_1.v.string(),
        type: values_1.v.string(), // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE'
        cronExpression: values_1.v.optional(values_1.v.string()),
        executeAt: values_1.v.optional(values_1.v.number()), // timestamp
        templateId: values_1.v.optional(values_1.v.id("templates")),
        messageContent: values_1.v.optional(values_1.v.string()),
        targetGroup: values_1.v.string(), // 'ALL_CUSTOMERS' | 'SPECIFIC_NUMBERS'
        targetNumbers: values_1.v.optional(values_1.v.array(values_1.v.string())),
        active: values_1.v.boolean(),
        lastRunAt: values_1.v.optional(values_1.v.number()), // timestamp
    }).index("by_org", ["organizationId"]),
    chatbotRules: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        sessionId: values_1.v.string(),
        trigger: values_1.v.string(),
        type: values_1.v.string(), // 'TEXT' | 'MEDIA' | 'AI'
        response: values_1.v.string(),
        mediaUrl: values_1.v.optional(values_1.v.string()),
        enabled: values_1.v.boolean(),
    }).index("by_org", ["organizationId"]).index("by_session", ["sessionId"]),
    customerStates: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        phoneNumber: values_1.v.string(),
        sessionId: values_1.v.string(),
        conversationState: values_1.v.string(),
        activeMenuId: values_1.v.optional(values_1.v.id("menus")),
    }).index("by_org_phone_session", ["organizationId", "phoneNumber", "sessionId"]),
    analyticsLogs: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        phoneNumber: values_1.v.string(),
        sessionId: values_1.v.string(),
        event: values_1.v.string(),
        metadata: values_1.v.optional(values_1.v.any()),
    }).index("by_org", ["organizationId"]),
});
