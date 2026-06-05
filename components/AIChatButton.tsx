'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function AIChatButton() {
  return (
    <Link
      href="/assistant"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white pl-4 pr-3 py-2.5 rounded-full shadow-lg shadow-black/30 transition-all hover:scale-105"
      aria-label="Chat with AI Assistant"
    >
      <span className="text-sm font-semibold">Chat with us</span>
      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>
    </Link>
  );
}
