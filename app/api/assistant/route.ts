import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the UAE Anglers Hub AI Fishing Assistant — an expert fishing guide specialising in UAE waters. You help anglers fish smarter across all 7 Emirates: Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah.

Your expertise includes:
- Shore fishing, kayak fishing, boat fishing, and deep-sea charter fishing in UAE
- Local fish species: Hammour (Grouper), Kingfish, Barracuda, Queenfish, Trevally, Snapper, Cobia, Sailfish, Yellowfin Tuna, Dorado, Sultan Ibrahim, Sea Bream, and more
- UAE fishing spots, best times, tides, and seasonal patterns
- Bait and lure recommendations for UAE conditions
- UAE fishing regulations, licensing, and protected species
- Gear recommendations suited to UAE saltwater conditions
- Weather interpretation for fishing (wind, tide, moon phase, water temperature)

Tone: Friendly, knowledgeable, concise. Keep responses focused and practical. When asked about conditions, always consider current season (UAE has hot summers Apr-Oct and cooler productive winters Nov-Mar). Suggest specific spots when relevant.`;

export async function POST(req: NextRequest) {
  const { messages, weather } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const weatherContext = weather
    ? `\n\nCurrent conditions provided by user: Temperature ${weather.temp}°C, Wind ${weather.wind} km/h, Weather: ${weather.description}, Wave height: ${weather.wave}m, Fishing score: ${weather.score}/100.`
    : '';

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + weatherContext,
      messages: messages.slice(-10),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply: text });
  } catch {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 500 });
  }
}
