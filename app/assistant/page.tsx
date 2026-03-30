'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, RefreshCw, Fish, Waves, Wind, Thermometer } from 'lucide-react';
import { EMIRATES } from '@/lib/emirates';

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Best spots for Kingfish in Dubai this week?',
  'What bait should I use for Hammour?',
  'Is tonight a good time to fish in RAK?',
  'What are the UAE fishing regulations I need to know?',
  'Best shore spots in Abu Dhabi for beginners?',
  'What species can I catch in Fujairah?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmirate, setSelectedEmirate] = useState(EMIRATES[0]);
  const [weather, setWeather] = useState<{ temp: number; wind: number; description: string; wave: number; score: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Fetch weather context for selected emirate
    fetch(`/api/weather?lat=${selectedEmirate.latitude}&lon=${selectedEmirate.longitude}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.weather?.current) {
          const c = data.weather.current;
          const { calcFishingScore, describeWeatherCode } = require('@/lib/emirates');
          const wave = data.marine?.current?.wave_height ?? 0;
          const score = calcFishingScore({ weatherCode: c.weather_code, windSpeed: c.wind_speed_10m, waveHeight: wave, humidity: c.relative_humidity_2m });
          setWeather({ temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), description: describeWeatherCode(c.weather_code).label, wave, score });
        }
      })
      .catch(() => {});
  }, [selectedEmirate]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, weather }),
      });
      const data = await res.json();
      if (data.reply) setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not connect. Please try again.' }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <div className="min-h-screen pt-14 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0f1a] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm">AI Fishing Assistant</h1>
                <p className="text-gray-500 text-xs">Powered by Claude · UAE fishing expert</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EMIRATES.map((em) => (
                <button key={em.slug} onClick={() => setSelectedEmirate(em)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${selectedEmirate.slug === em.slug ? 'bg-teal-500 border-teal-500 text-white' : 'border-white/20 text-gray-500 hover:border-teal-500/40 hover:text-white'}`}>
                  {em.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Weather context bar */}
          {weather && (
            <div className="flex items-center gap-4 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">
              <span className="font-medium text-white">{selectedEmirate.name}</span>
              <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-teal-400" />{weather.temp}°C</span>
              <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-teal-400" />{weather.wind} km/h</span>
              <span className="flex items-center gap-1"><Waves className="w-3 h-3 text-teal-400" />{weather.wave}m</span>
              <span className={`ml-auto font-bold ${weather.score >= 70 ? 'text-teal-400' : weather.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                Score: {weather.score}/100
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Fish className="w-12 h-12 text-teal-400/30 mx-auto mb-4" />
              <p className="text-white font-semibold mb-1">Ask me anything about fishing in the UAE</p>
              <p className="text-gray-500 text-sm mb-8">I know the spots, species, conditions and regulations</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 text-gray-300 hover:text-white text-sm transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot className="w-3.5 h-3.5 text-teal-400" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-teal-500 text-white rounded-br-sm'
                  : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mr-2 shrink-0">
                <Bot className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 rounded-bl-sm">
                <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-[#0a0f1a] px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about spots, species, conditions, regulations..."
            className="flex-1 bg-white/5 border border-white/20 focus:border-teal-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none text-sm resize-none"
            style={{ maxHeight: '120px' }}
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
