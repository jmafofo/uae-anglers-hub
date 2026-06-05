'use client';

import { useState, useRef, useCallback } from 'react';
import { X, ImagePlus, Loader2, Send } from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface UploadingFile {
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  error?: string;
}

export default function CreatePostModal({ onClose, onCreated }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (selected: FileList | null) => {
    if (!selected) return;
    const newFiles: UploadingFile[] = [];

    for (const file of Array.from(selected).slice(0, 10 - files.length)) {
      if (file.size > 5 * 1024 * 1024) {
        newFiles.push({ file, preview: URL.createObjectURL(file), uploading: false, error: 'File too large (max 5MB)' });
        continue;
      }
      if (!file.type.startsWith('image/')) {
        newFiles.push({ file, preview: URL.createObjectURL(file), uploading: false, error: 'Only images allowed' });
        continue;
      }
      newFiles.push({ file, preview: URL.createObjectURL(file), uploading: true });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Upload each file
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    for (let i = 0; i < newFiles.length; i++) {
      const uf = newFiles[i];
      if (uf.error) continue;

      const ext = uf.file.name.split('.').pop() || 'jpg';
      const path = `posts/${user.id}/${Date.now()}-${i}.${ext}`;

      const { error: uploadErr } = await sb.storage.from('catches').upload(path, uf.file, { upsert: true });
      if (uploadErr) {
        setFiles((prev) => prev.map((f) => f === uf ? { ...f, uploading: false, error: 'Upload failed' } : f));
        continue;
      }

      const { data: urlData } = sb.storage.from('catches').getPublicUrl(path);
      setFiles((prev) => prev.map((f) => f === uf ? { ...f, uploading: false, url: urlData.publicUrl } : f));
    }
  }, [files.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const media = files.filter((f) => f.url && !f.error).map((f) => ({ url: f.url!, type: 'image' }));
    if (media.length === 0) return;

    setSubmitting(true);
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ caption: caption.trim(), media }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to create post');
      }
    } catch {
      alert('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const canSubmit = files.some((f) => f.url && !f.error) && !files.some((f) => f.uploading);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#0a0f1a] border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold">New Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
            placeholder="Write a caption..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 resize-none"
          />
          <p className="text-[10px] text-gray-600 text-right">{caption.length}/2200</p>

          {/* Image previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  {f.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {f.error && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-1">
                      <p className="text-[10px] text-red-400 text-center">{f.error}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add images button */}
          {files.length < 10 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full py-6 rounded-xl border border-dashed border-white/20 hover:border-teal-500/40 flex flex-col items-center gap-2 text-gray-500 hover:text-teal-400 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-sm font-medium">Add photos</span>
              <span className="text-xs text-gray-600">Up to 10 images, 5MB each</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Share
          </button>
        </form>
      </div>
    </div>
  );
}
