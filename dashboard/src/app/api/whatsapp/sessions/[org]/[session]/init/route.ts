import { NextResponse, NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://vibrant-coyote-205.convex.cloud';
const convex = new ConvexHttpClient(convexUrl);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(_req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { session } = params;
    await (convex as any).mutation('sessions:initSession', { sessionId: session });
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500, headers: corsHeaders });
  }
}
