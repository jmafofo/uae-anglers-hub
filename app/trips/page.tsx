import type { Metadata } from 'next';
import TripsClient from './TripsClient';

export const metadata: Metadata = {
  title: 'Expeditions — UAE Anglers',
  description: 'Upcoming fishing trips across your lounges — RSVP and get the guide to the meeting point.',
};

export default function TripsPage() {
  return <TripsClient />;
}
