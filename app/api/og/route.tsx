import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = params.get('title')?.slice(0, 100) || 'Your next great fishing day.';
  const subtitle = params.get('subtitle')?.slice(0, 160) || 'Find your spot. Gear up. Get on the water.';
  const [photo, logo] = await Promise.all([
    readFile(path.join(process.cwd(), 'public/videos/hero-golden-hour.jpg')),
    readFile(path.join(process.cwd(), 'public/logo-icon.png')),
  ]);
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f6f5ee', color: '#143441', position: 'relative' }}>
      <div style={{ position: 'absolute', right: 0, top: 0, width: 555, height: 630, display: 'flex' }}>
        {/* ImageResponse renders plain image elements into the social card. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/jpeg;base64,${photo.toString('base64')}`} alt="" width={555} height={630} style={{ objectFit: 'cover', objectPosition: '54% center' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', width: 680, padding: '48px 48px 38px', background: '#f6f5ee', borderRadius: '0 46px 46px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 17 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${logo.toString('base64')}`} width={62} height={62} alt="" style={{ borderRadius: 14, background: '#143441', padding: 8 }} />
          <span style={{ fontSize: 49, fontWeight: 700, letterSpacing: -2 }}>UAEAngler<span style={{ color: '#28796e' }}>.</span></span>
        </div>
        <div style={{ display: 'flex', width: 55, height: 5, background: '#28796e', marginTop: 41, marginBottom: 24 }} />
        <div style={{ fontSize: title.length > 65 ? 42 : title.length > 38 ? 51 : 70, fontWeight: 700, letterSpacing: -2, lineHeight: 1.06, maxWidth: 570 }}>{title}</div>
        <div style={{ fontSize: 25, lineHeight: 1.4, color: '#4b646b', marginTop: 23, maxWidth: 520 }}>{subtitle}</div>
        <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #d3ded8', paddingTop: 21 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#28796e', letterSpacing: 2 }}>SPOTS · TACKLE · CHARTERS</span>
          <span style={{ fontSize: 19 }}>uaeangler.com</span>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } },
  );
}
