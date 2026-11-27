'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Live guide map: meeting pin + your position + a line between them. */

const pinIcon = L.divIcon({
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:#b8892d;border:2.5px solid #ffffff;box-shadow:0 4px 12px rgba(23,59,74,.4);display:flex;align-items:center;justify-content:center;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/></svg></div>`,
});

function FitBoth({ meeting, user }: { meeting: [number, number]; user: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (user) {
      map.fitBounds(L.latLngBounds([meeting, user]).pad(0.25));
    } else {
      map.setView(meeting, 13);
    }
  }, [map, meeting, user]);
  return null;
}

export default function TripGuideMap({
  meeting,
  meetingLabel,
  userPos,
}: {
  meeting: [number, number];
  meetingLabel: string;
  userPos: { lat: number; lng: number } | null;
}) {
  const user: [number, number] | null = userPos ? [userPos.lat, userPos.lng] : null;
  return (
    <MapContainer center={meeting} zoom={13} className="h-full w-full" style={{ background: '#dce9ec' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />
      <Marker position={meeting} icon={pinIcon} title={meetingLabel} />
      {user && (
        <>
          <CircleMarker center={user} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#45a99b', fillOpacity: 1 }} />
          <Polyline positions={[user, meeting]} pathOptions={{ color: '#23675e', weight: 3, dashArray: '6 8' }} />
        </>
      )}
      <FitBoth meeting={meeting} user={user} />
    </MapContainer>
  );
}
