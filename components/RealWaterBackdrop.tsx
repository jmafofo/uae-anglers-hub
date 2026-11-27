'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * RealWaterBackdrop — a rotating reel of real fishing footage behind the
 * hero: schooling baitfish, reef life, and a golden-hour angler. Clips
 * crossfade every ~11 s like a living screensaver. Autoplays muted/inline;
 * reduced-motion visitors get the first clip's poster frame.
 */
const CLIPS = [
  { src: '/videos/hero-fish-school.mp4', poster: '/videos/hero-fish-school.jpg' },
  { src: '/videos/hero-reef-life.mp4', poster: '/videos/hero-reef-life.jpg' },
  { src: '/videos/hero-golden-hour.mp4', poster: '/videos/hero-golden-hour.jpg' },
];

const ROTATE_MS = 11000;

export default function RealWaterBackdrop() {
  const [motionOk, setMotionOk] = useState(false);
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionOk(!query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Play the active clip, pause the rest
  useEffect(() => {
    if (!motionOk) return;
    refs.current.forEach((video, i) => {
      if (!video) return;
      if (i === active) {
        if (video.readyState === 0) video.load();
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [motionOk, active]);

  // Rotation timer
  useEffect(() => {
    if (!motionOk) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % CLIPS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [motionOk]);

  if (!motionOk) {
    return (
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CLIPS[0].poster} alt="" className="h-full w-full object-cover" />
        <Scrims />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {CLIPS.map((clip, i) => (
        <video
          key={clip.src}
          ref={(el) => { refs.current[i] = el; }}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
          poster={clip.poster}
          preload={i === 0 ? 'auto' : 'metadata'}
          muted
          loop
          playsInline
          disablePictureInPicture
          src={clip.src}
        />
      ))}
      <Scrims />
    </div>
  );
}

function Scrims() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f5faf9]/85 via-transparent to-white/30" />
    </>
  );
}
