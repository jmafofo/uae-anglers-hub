import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  const w = request.nextUrl.searchParams.get('w') ?? '800';

  if (!ref) {
    return new NextResponse('Missing ref parameter', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new NextResponse('Google Maps API key not configured', { status: 500 });
  }

  try {
    const googleUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${w}` +
      `&photo_reference=${encodeURIComponent(ref)}` +
      `&key=${apiKey}`;

    const res = await fetch(googleUrl, { redirect: 'follow' });

    if (!res.ok) {
      return new NextResponse('Failed to fetch photo from Google', { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('Content-Type') ?? 'image/jpeg';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively — photo refs are stable for weeks
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[spot-photo]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
