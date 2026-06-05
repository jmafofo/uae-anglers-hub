'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export interface SearchedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MemberSearchInputProps {
  selected: SearchedUser[];
  onChange: (users: SearchedUser[]) => void;
  excludeIds?: string[];
  placeholder?: string;
  label?: string;
}

export default function MemberSearchInput({
  selected,
  onChange,
  excludeIds = [],
  placeholder = 'Search anglers by name…',
  label = 'Members',
}: MemberSearchInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=8`);
      setSearching(false);
      if (res.ok) {
        const json = await res.json();
        const users: SearchedUser[] = json.users ?? [];
        const exclude = new Set([...excludeIds, ...selected.map((m) => m.id)]);
        setSuggestions(users.filter((u) => !exclude.has(u.id)));
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, selected, excludeIds]);

  function addUser(u: SearchedUser) {
    onChange([...selected, u]);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeUser(id: string) {
    onChange(selected.filter((u) => u.id !== id));
  }

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs"
            >
              {m.display_name ?? m.username}
              <button
                type="button"
                onClick={() => removeUser(m.id)}
                className="hover:text-white"
                aria-label={`Remove ${m.display_name ?? m.username}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-lg px-3 py-2 text-white placeholder-gray-600 outline-none text-sm"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
        )}

        {open && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0f1724] shadow-xl">
            {suggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => addUser(u)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center text-[10px] font-bold text-teal-400 shrink-0">
                  {(u.display_name ?? u.username)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{u.display_name ?? u.username}</p>
                  <p className="text-[10px] text-gray-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {open && query.trim().length >= 2 && !searching && suggestions.length === 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#0f1724] shadow-xl px-3 py-2 text-xs text-gray-500">
            No anglers found
          </div>
        )}
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-0"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
