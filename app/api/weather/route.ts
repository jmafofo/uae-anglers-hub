import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const revalidate = 1800; // cache 30 minutes

const querySchema = z.object({
  lat: z.string(),
  lon: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      lat: searchParams.get('lat'),
      lon: searchParams.get('lon'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
    }

    const { lat, lon } = parsed.data;

    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (
      !Number.isFinite(latNum) ||
      latNum < -90 ||
      latNum > 90 ||
      !Number.isFinite(lonNum) ||
      lonNum < -180 ||
      lonNum > 180
    ) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const [weatherRes, marineRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}` +
          `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,pressure_msl,visibility` +
          `&daily=sunrise,sunset,uv_index_max` +
          `&timezone=Asia%2FDubai&forecast_days=1`,
      ),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${latNum}&longitude=${lonNum}` +
          `&current=wave_height,wave_direction,wave_period,sea_surface_temperature` +
          `&timezone=Asia%2FDubai`,
      ),
    ]);

    if (!weatherRes.ok) {
      return NextResponse.json({ error: 'Weather API error' }, { status: 500 });
    }

    const weather = await weatherRes.json();
    const marine = marineRes.ok ? await marineRes.json() : null;

    return NextResponse.json(
      { weather, marine },
      {
        headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
      },
    );
  } catch (error) {
    console.error('[weather]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
