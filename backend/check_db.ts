import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.CONVEX_URL || "https://vibrant-coyote-205.convex.cloud");

async function reset() {
  try {
    fs.rmSync(".wwebjs_auth", { recursive: true, force: true });
    console.log("Deleted .wwebjs_auth");
  } catch(e) {
    console.error("Failed to delete auth folder", e);
  }

  // Find session a6n59k
  const org = await client.query("chatbot:getOrganization" as any, { slugOrId: "klb-connect" });
  
  // Wait, I don't have an endpoint to directly update session status by sessionId!
  // Oh, SessionManager has updateSessionStatus!
}
reset();
