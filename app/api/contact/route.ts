import { NextResponse } from 'next/server';
import { sendContactMessage } from '@/lib/email';

const SUBJECTS = new Set([
  'General enquiry',
  'Support',
  'Partnership / advertising',
  'Press / media',
  'Other',
]);

function readString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const name = readString(data.name, 120);
  const email = readString(data.email, 180).toLowerCase();
  const subject = readString(data.subject, 80);
  const message = readString(data.message, 4000);

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!SUBJECTS.has(subject)) {
    return NextResponse.json({ error: 'Please choose a valid subject.' }, { status: 400 });
  }

  if (message.length < 20) {
    return NextResponse.json({ error: 'Please include a message of at least 20 characters.' }, { status: 400 });
  }

  try {
    await sendContactMessage({ name, email, subject, message });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'We could not send your message right now. Please email info@uaeangler.com.' },
      { status: 500 },
    );
  }
}
