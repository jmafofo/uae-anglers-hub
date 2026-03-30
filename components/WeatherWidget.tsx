'use client';

import { useEffect, useState } from 'react';
import {
  Wind,
  Droplets,
  Eye,
  Thermometer,
  Waves,
  Sunrise,
  Sunset,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import {
  describeWeatherCode,
  windDirection,
  calcFishingScore,
  scoreLabel,
  type Emirate,
} from '@/lib/emirates';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    pressure_msl: number;
    visibility: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

interface MarineData {
  current: {
    wave_height: number;
    wave_direction: number;
    wave_period: number;
    sea_surface_temperature: number;
  };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  });
}

export default function WeatherWidget({ emirate }: { emirate: Emirate }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marine, setMarine] = useState<MarineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchWeather() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/weather?lat=${emirate.latitude}&lon=${emirate.longitude}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWeather(data.weather);
      setMarine(data.marine);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather();
  }, [emirate.slug]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading conditions for {emirate.name}...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-gray-500">
        <p className="mb-3">Unable to load weather data.</p>
        <button onClick={fetchWeather} className="text-teal-400 text-sm hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const c = weather.current;
  const wDesc = describeWeatherCode(c.weather_code);
  const waveH = marine?.current?.wave_height ?? 0;
  const score = calcFishingScore({
    weatherCode: c.weather_code,
    windSpeed: c.wind_speed_10m,
    waveHeight: waveH,
    humidity: c.relative_humidity_2m,
  });
  const { label: sLabel, color: sColor } = scoreLabel(score);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-start justify-between">
        <div>
          <div className="text-4xl mb-1">{wDesc.emoji}</div>
          <div className="text-3xl font-bold text-white">{Math.round(c.temperature_2m)}°C</div>
          <div className="text-gray-400 text-sm mt-1">{wDesc.label}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Fishing Score</div>
          <div className={`text-4xl font-extrabold ${sColor}`}>{score}</div>
          <div className={`text-sm font-semibold ${sColor}`}>{sLabel}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/5">
        {[
          {
            icon: Wind,
            label: 'Wind',
            value: `${Math.round(c.wind_speed_10m)} km/h ${windDirection(c.wind_direction_10m)}`,
          },
          {
            icon: Droplets,
            label: 'Humidity',
            value: `${c.relative_humidity_2m}%`,
          },
          {
            icon: Eye,
            label: 'Visibility',
            value: `${(c.visibility / 1000).toFixed(1)} km`,
          },
          {
            icon: Gauge,
            label: 'Pressure',
            value: `${Math.round(c.pressure_msl)} hPa`,
          },
          {
            icon: Waves,
            label: 'Wave Height',
            value: marine ? `${marine.current.wave_height?.toFixed(1) ?? '—'} m` : '—',
          },
          {
            icon: Thermometer,
            label: 'Sea Temp',
            value: marine
              ? `${Math.round(marine.current.sea_surface_temperature ?? 0)}°C`
              : '—',
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#0a0f1a] p-4 flex items-center gap-3">
            <Icon className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-sm text-white font-medium">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sunrise / Sunset */}
      <div className="p-4 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Sunrise className="w-4 h-4 text-yellow-400" />
          <span>Sunrise {formatTime(weather.daily.sunrise[0])}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Sunset className="w-4 h-4 text-orange-400" />
          <span>Sunset {formatTime(weather.daily.sunset[0])}</span>
        </div>
      </div>

      {lastUpdated && (
        <div className="px-4 pb-3 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Updated {lastUpdated.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={fetchWeather}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-400 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
