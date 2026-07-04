'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const subjects = [
  'General enquiry',
  'Support',
  'Partnership / advertising',
  'Press / media',
  'Other',
];

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus('error');
      setError(typeof json.error === 'string' ? json.error : 'We could not send your message.');
      return;
    }

    form.reset();
    setStatus('sent');
  }

  return (
    <form
      className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5"
      onSubmit={handleSubmit}
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-colors"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-colors"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          required
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-colors"
        >
          <option value="" className="bg-[#0a0f1a]">
            Select a topic
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject} className="bg-[#0a0f1a]">
              {subject}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={20}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-colors resize-y"
          placeholder="How can we help?"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-[#0a0f1a] font-semibold px-6 py-2.5 transition-colors"
      >
        {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
        Send message
      </button>
      {status === 'sent' && (
        <p className="inline-flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Message sent. We will reply by email.
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </form>
  );
}
