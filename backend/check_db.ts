import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.CONVEX_URL || "https://vibrant-coyote-205.convex.cloud");

async function check() {
  const rules = await client.query("rules:getByOrg" as any, { organizationSlug: "klb-connect" });
  console.log("Rules:", rules.map((r: any) => ({ trigger: r.trigger, type: r.type, response: r.response })));
}
check();
