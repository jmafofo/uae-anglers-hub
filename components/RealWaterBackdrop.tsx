'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * RealWaterBackdrop — real underwater footage (a schooling baitfish swarm)
 * as the hero backdrop, with the coastal white scrim so foreground text
 * keeps its contrast. Autoplays muted/inline; honors reduced-motion by
 * freezing on the poster frame; pauses in hidden tabs (browser-native for
 * muted video, but we also guard play() rejection).
 */
export default function RealWaterBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionOk(!query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!motionOk || !videoRef.current) return;
    videoRef.current.play().catch(() => { /* autoplay blocked — poster stays */ });
  }, [motionOk]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        poster="/videos/hero-fish-school.jpg"
        preload={motionOk ? 'auto' : 'none'}
        muted
        loop
        playsInline
        disablePictureInPicture
        src="/videos/hero-fish-school.mp4"
      />
      {/* Coastal scrims — keep the left text column readable, let the
          school show through on the right and bottom */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f5faf9]/85 via-transparent to-white/30" />
    </div>
  );
}
