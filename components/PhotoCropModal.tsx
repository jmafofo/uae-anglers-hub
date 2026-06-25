'use client';

import { useRef, useState, useCallback } from 'react';
import { Cropper, ReactCropperElement } from 'react-cropper';
import { X, RotateCcw, ZoomIn, ZoomOut, Check } from 'lucide-react';
import 'react-cropper/node_modules/cropperjs/dist/cropper.css';

interface PhotoCropModalProps {
  src: string;
  fileName: string;
  onClose: () => void;
  onSave: (croppedFile: File) => void;
}

export default function PhotoCropModal({ src, fileName, onClose, onSave }: PhotoCropModalProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [saving, setSaving] = useState(false);

  const getCroppedFile = useCallback(async (): Promise<File | null> => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return null;

    const canvas = cropper.getCroppedCanvas({
      fillColor: '#000',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (!canvas) return null;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const ext = fileName.split('.').pop()?.toLowerCase() || 'jpeg';
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          const newName = fileName.replace(/\.[^.]+$/, '') + '_cropped.' + (ext === 'png' ? 'png' : 'jpg');
          resolve(new File([blob], newName, { type: mime }));
        },
        'image/jpeg',
        0.92,
      );
    });
  }, [fileName]);

  const handleSave = async () => {
    setSaving(true);
    const croppedFile = await getCroppedFile();
    setSaving(false);
    if (croppedFile) onSave(croppedFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Crop Photo</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative bg-black">
          <Cropper
            ref={cropperRef}
            src={src}
            style={{ height: 360, width: '100%' }}
            aspectRatio={NaN}
            viewMode={1}
            dragMode="move"
            guides={true}
            background={false}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false}
            rotatable={false}
            scalable={false}
            zoomable={true}
            zoomOnTouch={true}
            zoomOnWheel={true}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => cropperRef.current?.cropper?.zoom(-0.1)}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => cropperRef.current?.cropper?.zoom(0.1)}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => cropperRef.current?.cropper?.reset()}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white text-sm font-semibold"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
