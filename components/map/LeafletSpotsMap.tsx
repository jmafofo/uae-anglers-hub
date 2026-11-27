'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FishingSpot } from '@/lib/spots';

const TILES = {
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
  },
} as const;

/**
 * LeafletSpotsMap — interactive UAE fishing-spots map.
 *
 * Clustering is a lightweight grid bucketing in screen space (recomputed on
 * move/zoom), so we ship zero extra dependencies. Single spots render as
 * coastal-teal pins; clusters as count bubbles that zoom in on tap.
 * Selecting a spot bubbles up to the parent, which renders the preview card.
 */

const UAE_CENTER: [number, number] = [24.35, 54.6];

interface Cluster {
  key: string;
  lat: number;
  lng: number;
  spots: FishingSpot[];
}

const FISH_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/></svg>';

const spotIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 36],
  html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:#23675e;border:2px solid #ffffff;box-shadow:0 3px 8px rgba(23,59,74,.35);display:flex;align-items:center;justify-content:center;">${FISH_SVG}</div>`,
});

function clusterIcon(count: number) {
  const size = count < 10 ? 44 : 52;
  const ring = count >= 10 ? 'box-shadow:0 0 0 3px rgba(212,175,90,.5),0 4px 10px rgba(23,59,74,.3);' : 'box-shadow:0 4px 10px rgba(23,59,74,.3);';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:linear-gradient(135deg,#2a7a6f,#174e47);border:2px solid #ffffff;${ring}display:flex;align-items:center;justify-content:center;color:#ffffff;font:600 ${count < 10 ? 15 : 16}px/1 system-ui,sans-serif;">${count}</div>`,
  });
}

function computeClusters(map: L.Map, spots: FishingSpot[], cellPx = 72): Cluster[] {
  const buckets = new Map<string, FishingSpot[]>();
  for (const s of spots) {
    const p = map.latLngToContainerPoint([s.latitude, s.longitude]);
    const key = `${Math.floor(p.x / cellPx)}:${Math.floor(p.y / cellPx)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(s);
    else buckets.set(key, [s]);
  }
  return Array.from(buckets.entries()).map(([key, bucketSpots]) => ({
    key,
    lat: bucketSpots.reduce((a, s) => a + s.latitude, 0) / bucketSpots.length,
    lng: bucketSpots.reduce((a, s) => a + s.longitude, 0) / bucketSpots.length,
    spots: bucketSpots,
  }));
}

/** Recomputes clusters whenever the map settles or the spot list changes. */
function ClusterLayer({
  spots,
  onSelect,
}: {
  spots: FishingSpot[];
  onSelect: (spot: FishingSpot) => void;
}) {
  const map = useMap();
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useEffect(() => {
    const recompute = () => setClusters(computeClusters(map, spots));
    recompute();
    map.on('moveend zoomend resize', recompute);
    return () => {
      map.off('moveend zoomend resize', recompute);
    };
  }, [map, spots]);

  const zoomInto = useCallback(
    (c: Cluster) => {
      map.setView([c.lat, c.lng], Math.min(map.getZoom() + 2, 14), { animate: true });
    },
    [map],
  );

  return (
    <>
      {clusters.map((c) =>
        c.spots.length === 1 ? (
          <Marker
            key={c.spots[0].slug}
            position={[c.spots[0].latitude, c.spots[0].longitude]}
            icon={spotIcon}
            eventHandlers={{ click: () => onSelect(c.spots[0]) }}
          />
        ) : (
          <Marker
            key={c.key}
            position={[c.lat, c.lng]}
            icon={clusterIcon(c.spots.length)}
            eventHandlers={{ click: () => zoomInto(c) }}
          />
        ),
      )}
    </>
  );
}

/** Flies to the user once geolocation resolves. */
function FlyToUser({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 11, { duration: 1.2 });
  }, [map, pos]);
  return null;
}

export default function LeafletSpotsMap({
  spots,
  userPos,
  onSelect,
}: {
  spots: FishingSpot[];
  userPos: { lat: number; lng: number } | null;
  onSelect: (spot: FishingSpot) => void;
}) {
  const [layer, setLayer] = useState<keyof typeof TILES>('satellite');
  const tiles = TILES[layer];

  return (
    <>
      <MapContainer
        center={UAE_CENTER}
        zoom={8}
        minZoom={6}
        maxZoom={17}
        className="h-full w-full"
        style={{ background: layer === 'satellite' ? '#0d1f33' : '#e8f0f2' }}
      >
        <TileLayer key={layer} url={tiles.url} attribution={tiles.attribution} maxZoom={19} />
        <ClusterLayer spots={spots} onSelect={onSelect} />
        <FlyToUser pos={userPos} />
        {userPos && (
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#45a99b', fillOpacity: 1 }}
          />
        )}
      </MapContainer>

      {/* Street / satellite toggle — satellite helps anglers recognise
          the actual shoreline, rocks and access points */}
      <div className="absolute right-3 top-3 z-[500] flex overflow-hidden rounded-lg border border-[#e1e7eb] bg-white shadow-md">
        {(['street', 'satellite'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLayer(mode)}
            aria-pressed={layer === mode}
            className={`px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${
              layer === mode ? 'bg-[#23675e] text-white' : 'bg-white text-[#4a5d68] hover:bg-[#f0f4f5]'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </>
  );
}
