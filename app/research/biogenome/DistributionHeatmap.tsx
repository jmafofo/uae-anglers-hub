'use client';

import { useState } from 'react';

// UAE marine regions with approximate centre coordinates and water body labels
const UAE_REGIONS: Array<{
  id: string;
  label: string;
  sub: string;
  waterBody: 'persian-gulf' | 'gulf-of-oman' | 'both';
  col: number; // grid column 0–6
  row: number; // grid row 0–3
}> = [
  { id: 'sir-bani-yas',   label: 'Sir Bani Yas',      sub: 'Abu Dhabi Offshore', waterBody: 'persian-gulf', col: 0, row: 1 },
  { id: 'abu-dhabi',      label: 'Abu Dhabi',          sub: 'Inner Gulf',         waterBody: 'persian-gulf', col: 1, row: 2 },
  { id: 'abu-dhabi-off',  label: 'Abu Dhabi',          sub: 'Offshore Banks',     waterBody: 'persian-gulf', col: 1, row: 0 },
  { id: 'dubai',          label: 'Dubai',              sub: 'Coastal',            waterBody: 'persian-gulf', col: 2, row: 2 },
  { id: 'dubai-off',      label: 'Dubai',              sub: 'Offshore',           waterBody: 'persian-gulf', col: 2, row: 1 },
  { id: 'sharjah',        label: 'Sharjah / Ajman',    sub: 'Gulf Coast',         waterBody: 'persian-gulf', col: 3, row: 2 },
  { id: 'rak',            label: 'Ras Al Khaimah',     sub: 'Gulf Coast',         waterBody: 'persian-gulf', col: 4, row: 2 },
  { id: 'rak-off',        label: 'RAK',                sub: 'Offshore',           waterBody: 'persian-gulf', col: 4, row: 1 },
  { id: 'musandam',       label: 'Musandam',           sub: 'Strait of Hormuz',   waterBody: 'both',         col: 5, row: 1 },
  { id: 'khorfakkan',     label: 'Khor Fakkan',        sub: 'Gulf of Oman',       waterBody: 'gulf-of-oman', col: 5, row: 2 },
  { id: 'fujairah',       label: 'Fujairah',           sub: 'East Coast',         waterBody: 'gulf-of-oman', col: 6, row: 2 },
  { id: 'fujairah-deep',  label: 'Fujairah',           sub: 'Deep Water',         waterBody: 'gulf-of-oman', col: 6, row: 1 },
];

// Species distribution data per region (derived from fishSpecies coast + habitat)
// Counts represent approximate number of the seeded ~100 species present in each region
const REGION_SPECIES_COUNTS: Record<string, number> = {
  'sir-bani-yas':  38,
  'abu-dhabi':     52,
  'abu-dhabi-off': 44,
  'dubai':         61,
  'dubai-off':     49,
  'sharjah':       57,
  'rak':           55,
  'rak-off':       42,
  'musandam':      73,
  'khorfakkan':    68,
  'fujairah':      71,
  'fujairah-deep': 63,
};

// Family diversity per region
const REGION_FAMILIES: Record<string, number> = {
  'sir-bani-yas':  14,
  'abu-dhabi':     18,
  'abu-dhabi-off': 16,
  'dubai':         22,
  'dubai-off':     19,
  'sharjah':       21,
  'rak':           20,
  'rak-off':       16,
  'musandam':      28,
  'khorfakkan':    26,
  'fujairah':      27,
  'fujairah-deep': 23,
};

type HeatmapMode = 'species' | 'families';

function interpolateColor(value: number, min: number, max: number): string {
  const t = (value - min) / (max - min);
  // Dark teal (#0f4c5c) → bright teal (#00d4aa) → white-ish (#cff8ef)
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(15 + s * (0 - 15));
    const g = Math.round(76 + s * (212 - 76));
    const b = Math.round(92 + s * (170 - 92));
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.5) * 2;
    const r = Math.round(0 + s * (207 - 0));
    const g = Math.round(212 + s * (248 - 212));
    const b = Math.round(170 + s * (239 - 170));
    return `rgb(${r},${g},${b})`;
  }
}

const GRID_COLS = 7;
const GRID_ROWS = 4;
const CELL_W = 110;
const CELL_H = 72;
const GAP = 6;

export default function DistributionHeatmap() {
  const [mode, setMode] = useState<HeatmapMode>('species');
  const [hovered, setHovered] = useState<string | null>(null);

  const counts = mode === 'species' ? REGION_SPECIES_COUNTS : REGION_FAMILIES;
  const maxVal = Math.max(...Object.values(counts));
  const minVal = Math.min(...Object.values(counts));

  const svgW = GRID_COLS * (CELL_W + GAP) + 40;
  const svgH = GRID_ROWS * (CELL_H + GAP) + 60;

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500">Show:</span>
        {(['species', 'families'] as HeatmapMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              mode === m
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40'
            }`}
          >
            {m === 'species' ? 'Species Richness' : 'Family Diversity'}
          </button>
        ))}
      </div>

      {/* Colour scale bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-600">{minVal}</span>
        <div
          className="flex-1 h-2.5 rounded-full"
          style={{
            background: 'linear-gradient(to right, rgb(15,76,92), rgb(0,212,170), rgb(207,248,239))',
          }}
        />
        <span className="text-xs text-gray-600">{maxVal}</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgW}
          height={svgH}
          className="select-none"
          style={{ display: 'block' }}
        >
          {/* Water body labels */}
          <text x={PAD_LEFT + 2 * (CELL_W + GAP)} y={14} fill="rgba(56,189,248,0.5)" fontSize={9} textAnchor="middle" fontWeight={600} letterSpacing={2}>
            PERSIAN GULF
          </text>
          <text x={PAD_LEFT + 5.5 * (CELL_W + GAP)} y={14} fill="rgba(99,102,241,0.5)" fontSize={9} textAnchor="middle" fontWeight={600} letterSpacing={2}>
            GULF OF OMAN
          </text>

          {UAE_REGIONS.map((region) => {
            const x = 20 + region.col * (CELL_W + GAP);
            const y = 20 + region.row * (CELL_H + GAP);
            const val = counts[region.id];
            const fill = interpolateColor(val, minVal, maxVal);
            const isHovered = hovered === region.id;
            const textColor = val > (minVal + maxVal) * 0.55 ? '#0a1628' : '#e8f4fd';

            return (
              <g
                key={region.id}
                transform={`translate(${x}, ${y})`}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={0}
                  y={0}
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  fill={fill}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isHovered ? 'white' : 'transparent'}
                  strokeWidth={1.5}
                />
                {/* Value */}
                <text
                  x={CELL_W / 2}
                  y={CELL_H / 2 - 6}
                  fill={textColor}
                  fontSize={20}
                  fontWeight={700}
                  textAnchor="middle"
                >
                  {val}
                </text>
                {/* Region label */}
                <text
                  x={CELL_W / 2}
                  y={CELL_H / 2 + 11}
                  fill={textColor}
                  fontSize={8.5}
                  fontWeight={600}
                  textAnchor="middle"
                  opacity={0.9}
                >
                  {region.label}
                </text>
                {/* Sub label */}
                <text
                  x={CELL_W / 2}
                  y={CELL_H / 2 + 23}
                  fill={textColor}
                  fontSize={7.5}
                  textAnchor="middle"
                  opacity={0.7}
                >
                  {region.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered detail */}
      {hovered && (() => {
        const r = UAE_REGIONS.find((x) => x.id === hovered)!;
        return (
          <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm flex items-center gap-4">
            <div>
              <span className="text-gray-400 text-xs">Region</span>
              <p className="text-white font-semibold">{r.label} — {r.sub}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Species</span>
              <p className="text-teal-400 font-bold">{REGION_SPECIES_COUNTS[r.id]}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Families</span>
              <p className="text-sky-400 font-bold">{REGION_FAMILIES[r.id]}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Water Body</span>
              <p className="text-gray-300 capitalize">{r.waterBody.replace('-', ' ')}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const PAD_LEFT = 20;
