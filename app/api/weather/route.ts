import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 1800; // cache 30 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const [weatherRes, marineRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,pressure_msl,visibility` +
        `&daily=sunrise,sunset,uv_index_max` +
        `&timezone=Asia%2FDubai&forecast_days=1`
    ),
    fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
        `&current=wave_height,wave_direction,wave_period,sea_surface_temperature` +
        `&timezone=Asia%2FDubai`
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
    }
  );
}
