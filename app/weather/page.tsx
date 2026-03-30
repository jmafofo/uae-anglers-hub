import type { Metadata } from 'next';
import WeatherPage from './WeatherPage';

export const metadata: Metadata = {
  title: 'UAE Fishing Weather & Conditions — All 7 Emirates',
  description:
    'Real-time fishing conditions across all 7 UAE Emirates. Wind, wave height, sea temperature, fishing score, sunrise/sunset, and AI-powered tips.',
};

export default function Page() {
  return <WeatherPage />;
}
