import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    apiKey: v.string(),
    settings: v.object({
      conversationTimeoutMinutes: v.number(),
      typingDelay: v.object({
        min: v.number(),
        max: v.number(),
      }),
    }),
  }).index("by_slug", ["slug"]).index("by_apiKey", ["apiKey"]),

  templates: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    category: v.string(),
    content: v.string(),
    variables: v.array(v.string()),
    active: v.boolean(),
  }).index("by_org", ["organizationId"]),

  whatsappSessions: defineTable({
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    phoneNumber: v.optional(v.string()),
    name: v.string(),
    qrCode: v.optional(v.string()),
    status: v.string(),
    lastActive: v.number(), // timestamp
    settings: v.object({
      autoReply: v.boolean(),
      aiEnabled: v.boolean(),
      typingDelay: v.object({
        min: v.number(),
        max: v.number(),
      }),
    }),
  }).index("by_org", ["organizationId"]).index("by_sessionId", ["sessionId"]),

  menus: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    content: v.string(),
    options: v.array(
      v.object({
        keyword: v.string(),
        label: v.string(),
        action: v.string(), // 'NEXT_MENU' | 'SEND_TEMPLATE' | 'TRIGGER_FLOW'
        targetId: v.optional(v.string()),
      })
    ),
    parentMenuId: v.optional(v.id("menus")),
    isRoot: v.boolean(),
    active: v.boolean(),
  }).index("by_org", ["organizationId"]),

  schedules: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.string(), // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE'
    cronExpression: v.optional(v.string()),
    executeAt: v.optional(v.number()), // timestamp
    templateId: v.optional(v.id("templates")),
    messageContent: v.optional(v.string()),
    targetGroup: v.string(), // 'ALL_CUSTOMERS' | 'SPECIFIC_NUMBERS'
    targetNumbers: v.optional(v.array(v.string())),
    active: v.boolean(),
    lastRunAt: v.optional(v.number()), // timestamp
  }).index("by_org", ["organizationId"]),

  chatbotRules: defineTable({
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    trigger: v.string(),
    type: v.string(), // 'TEXT' | 'MEDIA' | 'AI'
    response: v.string(),
    mediaUrl: v.optional(v.string()),
    enabled: v.boolean(),
  }).index("by_org", ["organizationId"]).index("by_session", ["sessionId"]),

  customerStates: defineTable({
    organizationId: v.id("organizations"),
    phoneNumber: v.string(),
    sessionId: v.string(),
    conversationState: v.string(),
    activeMenuId: v.optional(v.id("menus")),
  }).index("by_org_phone_session", ["organizationId", "phoneNumber", "sessionId"]),

  analyticsLogs: defineTable({
    organizationId: v.id("organizations"),
    phoneNumber: v.string(),
    sessionId: v.string(),
    event: v.string(),
    metadata: v.optional(v.any()),
  }).index("by_org", ["organizationId"]),
});
