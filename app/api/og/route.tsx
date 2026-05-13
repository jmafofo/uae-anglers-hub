import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title')?.slice(0, 100) || "UAE Anglers Hub";
    const subtitle = searchParams.get('subtitle')?.slice(0, 200) || "Catch More. Explore Smarter. Connect Deeper.";

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0f1a',
            backgroundImage: `
              radial-gradient(ellipse 130% 80% at 50% 115%, rgba(0,212,170,0.25) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 90% 15%, rgba(45,140,220,0.18) 0%, transparent 55%),
              linear-gradient(180deg, #0d1f33 0%, #0a0f1a 100%)
            `,
            padding: '60px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <img
              src="https://uaeangler.com/logo-icon.png"
              width="80"
              height="80"
              style={{
                borderRadius: '16px',
                marginRight: '24px',
              }}
              alt=""
            />
            <div
              style={{
                fontSize: '52px',
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              UAE Anglers Hub
            </div>
          </div>

          <div
            style={{
              fontSize: '42px',
              fontWeight: '700',
              color: '#00d4aa',
              marginBottom: '24px',
              maxWidth: '900px',
              lineHeight: '1.2',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: '28px',
              color: '#9ca3af',
              maxWidth: '800px',
              lineHeight: '1.4',
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#00d4aa',
              }}
            />
            <span style={{ fontSize: '20px', color: '#6b7280' }}>
              uaeangler.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('[og]', e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
