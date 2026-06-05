import { NextResponse, NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://vibrant-coyote-205.convex.cloud';
const convex = new ConvexHttpClient(convexUrl);

export async function GET(_req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const org = params.org;
    const sessions = await (convex as any).query('sessions:getByOrg', { organizationSlug: org });
    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const org = params.org;
    const body = await req.json();
    const name = body?.name || 'Unnamed session';
    const result = await (convex as any).mutation('sessions:createSession', { organizationSlug: org, name });
    return NextResponse.json({ ok: true, id: result });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
