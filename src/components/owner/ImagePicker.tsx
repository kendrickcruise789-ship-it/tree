import React, { useRef, useState } from 'react';
import { uploadProductImage } from '../../shop/api';
import { bundledImageOptions } from '../../shop/schema';
import { ProductThumb } from './ProductThumb';
import { ChevronLeft, ChevronRight, LoaderCircle, ImageOff, Trash2, Upload, Star } from 'lucide-react';

interface ImagePickerProps {
  /** Photos in display order. The first one is what shoppers see in the grid. */
  values: string[];
  onChange: (refs: string[]) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_IMAGES = 6;

export const ImagePicker: React.FC<ImagePickerProps> = ({ values, onChange }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset immediately so choosing the same files again still fires a change event.
    event.target.value = '';
    if (!files.length) return;
    setUploadError(null);

    const room = MAX_IMAGES - values.length;
    if (room <= 0) {
      setUploadError(`Six pictures is the maximum. Remove one before uploading another.`);
      return;
    }

    setUploading(true);
    const next = [...values];
    for (const file of files.slice(0, room)) {
      const result = await uploadProductImage(file);
      if ('error' in result) {
        setUploadError(result.error);
        break;
      }
      next.push(result.ref);
    }
    setUploading(false);
    if (next.length !== values.length) onChange(next);
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  /** Move a picture `delta` places. The first slot is the grid thumbnail, so order matters. */
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  }

  function makePrimary(index: number) {
    if (index === 0) return;
    const next = [...values];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  }

  function addStudioPhoto(ref: string) {
    if (values.includes(ref)) {
      makePrimary(values.indexOf(ref));
      return;
    }
    if (values.length >= MAX_IMAGES) {
      setUploadError(`Six pictures is the maximum. Remove one first.`);
      return;
    }
    setUploadError(null);
    onChange([...values, ref]);
  }

  return (
    <div className="border border-[#EDE6DC] bg-[#FBF8F2] p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#5C5349]">
          Pictures · {values.length} of {MAX_IMAGES}
        </span>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 border border-[#C6934B] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-1.5 transition-colors hover:bg-[#C6934B]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{uploading ? 'Uploading…' : 'Upload photos'}</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleFiles}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {values.length === 0 ? (
        <p className="text-xs text-[#5C5349] flex items-center gap-1.5">
          <ImageOff className="w-3.5 h-3.5" /> No picture yet. Upload your own or pick a studio photo below.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {values.map((ref, index) => (
            <li key={`${ref}-${index}`} className="border border-[#EDE6DC] bg-[#FDFBF7] p-2 space-y-2">
              <div className="relative">
                <ProductThumb imageRef={ref} className="w-full aspect-[3/4]" alt={`Picture ${index + 1}`} />
                {index === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-[#C6934B] text-[#FDFBF7] text-[10px] uppercase tracking-[0.15em] py-1 text-center">
                    Main photo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    title="Show this one first"
                    aria-label={`Make picture ${index + 1} the main photo`}
                    className="p-2 text-[#5C5349] hover:text-[#C6934B] transition-colors"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move picture ${index + 1} earlier`}
                  className="p-2 text-[#5C5349] hover:text-[#1E1B18] transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === values.length - 1}
                  aria-label={`Move picture ${index + 1} later`}
                  className="p-2 text-[#5C5349] hover:text-[#1E1B18] transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove picture ${index + 1}`}
                  className="p-2 text-[#A8523C] hover:text-[#8a3f2d] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="ml-auto text-[10px] text-[#5C5349] tabular-nums">
                  {ref.startsWith('shop:') ? 'Your photo' : ref.startsWith('bundled:') ? 'Studio' : 'Linked'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploadError && (
        <p className="text-xs text-[#A8523C]" role="status">
          {uploadError}
        </p>
      )}

      <p className="text-[11px] text-[#5C5349]">
        Uploading stores the file straight away, but the shop keeps showing the old pictures until you press Save.
      </p>

      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#5C5349] mb-2">Studio photos</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {bundledImageOptions().map((option) => {
            const ref = `bundled:${option.key}`;
            const position = values.indexOf(ref);
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={position !== -1}
                aria-label={`Use studio photo ${option.key}`}
                onClick={() => addStudioPhoto(ref)}
                className={`relative aspect-[3/4] overflow-hidden border transition-all ${
                  position === 0
                    ? 'border-[#C6934B] ring-2 ring-[#C6934B]/40'
                    : position > 0
                      ? 'border-[#C6934B]/60'
                      : 'border-[#EDE6DC] hover:border-[#C6934B]'
                }`}
              >
                <img src={option.src} alt="" loading="lazy" className="w-full h-full object-cover object-top" />
                {position !== -1 && (
                  <span className="absolute inset-x-0 bottom-0 bg-[#C6934B] text-[#FDFBF7] text-[10px] uppercase tracking-[0.15em] py-0.5 text-center">
                    {position === 0 ? 'Main' : `No. ${position + 1}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
