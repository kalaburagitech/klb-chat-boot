import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.CONVEX_URL || "https://vibrant-coyote-205.convex.cloud");

async function createRules() {
  const rulesToCreate = [
    { trigger: "1", response: "jn732ewwjnwb98bpmj6y7eqjj5881s4w" }, // ai_ml_projects
    { trigger: "2", response: "jn74sfkbfnff9g36gt1annk8c5880vm2" }, // mobile_app_services
    { trigger: "3", response: "jn776yc1v6brsvm7ys3b122p5n881246" }, // website_development
    { trigger: "4", response: "jn75c0a88nsss1nww6wrgxryr9880rfg" }, // college_projects
    { trigger: "5", response: "jn70wznmx2xvv0xtaee1x1mqdn8809r6" }  // contact_kalaburagitech
  ];

  for (const rule of rulesToCreate) {
    await client.mutation("rules:createRule" as any, {
      organizationSlug: "klb-connect",
      sessionId: "a6n59k",
      trigger: rule.trigger,
      type: "TEMPLATE",
      response: rule.response
    });
    console.log("Created rule for:", rule.trigger);
  }
}
createRules();
