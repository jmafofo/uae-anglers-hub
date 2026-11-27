import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Victory card — the shareable coronation image.
 * /api/og/victory?name=Ahmed&species=Kingfish&value=12.4 kg&emirate=Dubai&week=24%20–%2030%20Nov
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') ?? 'UAE Angler').slice(0, 40);
  const species = (searchParams.get('species') ?? 'Unknown species').slice(0, 50);
  const value = (searchParams.get('value') ?? '').slice(0, 20);
  const emirate = (searchParams.get('emirate') ?? '').slice(0, 30);
  const week = (searchParams.get('week') ?? '').slice(0, 30);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0f1a',
          backgroundImage:
            'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(212,175,90,0.22) 0%, transparent 55%), radial-gradient(ellipse 120% 70% at 50% 115%, rgba(0,212,170,0.16) 0%, transparent 60%), linear-gradient(180deg, #101a2b 0%, #0a0f1a 100%)',
          padding: '56px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Crown */}
        <svg width="96" height="72" viewBox="0 0 96 72" style={{ marginBottom: 8 }}>
          <path
            d="M8 60 L4 20 L28 38 L48 8 L68 38 L92 20 L88 60 Z"
            fill="#d4af5a"
            stroke="#f3d489"
            strokeWidth="2"
          />
          <circle cx="4" cy="18" r="5" fill="#f3d489" />
          <circle cx="48" cy="6" r="5" fill="#f3d489" />
          <circle cx="92" cy="18" r="5" fill="#f3d489" />
          <rect x="8" y="62" width="80" height="6" rx="3" fill="#b8892d" />
        </svg>

        <div style={{ fontSize: 22, letterSpacing: 6, color: '#d4af5a', textTransform: 'uppercase', marginBottom: 12 }}>
          King of UAE Waters
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, marginBottom: 10 }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ fontSize: 34, color: '#9fd8cc' }}>{species}</span>
          {value && (
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: '#f3d489',
                backgroundColor: 'rgba(212,175,90,0.14)',
                border: '2px solid rgba(212,175,90,0.5)',
                borderRadius: 12,
                padding: '4px 18px',
              }}
            >
              {value}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 20, color: '#8b98a8' }}>
          {emirate && <span>{emirate}</span>}
          {week && <span>{emirate ? '·' : ''} {week}</span>}
        </div>
        <div style={{ position: 'absolute', bottom: 36, fontSize: 20, color: '#5b6b77', letterSpacing: 2 }}>
          uaeangler.com — Hall of Fame
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
