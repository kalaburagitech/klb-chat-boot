import { ConvexHttpClient, ConvexClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config();

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("CONVEX_URL environment variable is missing.");
}

export const convex = new ConvexHttpClient(CONVEX_URL);
export const convexClient = new ConvexClient(CONVEX_URL);
