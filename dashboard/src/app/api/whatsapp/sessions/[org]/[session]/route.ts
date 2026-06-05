import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://vibrant-coyote-205.convex.cloud';
const convex = new ConvexHttpClient(convexUrl);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function DELETE(_req: Request, { params }: { params: { org: string; session: string } }) {
  try {
    const { org, session } = params;
    await convex.mutation('sessions:deleteSession', { organizationSlug: org, sessionId: session });
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(_req: Request, { params }: { params: { org: string; session: string } }) {
  try {
    const { session } = params;
    const data = await convex.query('sessions:getSession', { sessionId: session });
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500, headers: corsHeaders });
  }
}
