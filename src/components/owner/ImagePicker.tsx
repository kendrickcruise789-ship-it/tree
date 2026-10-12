import React, { useRef, useState } from 'react';
import { uploadProductImage } from '../../shop/api';
import { bundledImageOptions, resolveImage } from '../../shop/schema';
import { ProductThumb } from './ProductThumb';
import { Upload, LoaderCircle, ImageOff } from 'lucide-react';

interface ImagePickerProps {
  value: string;
  onChange: (ref: string) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';

export const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resolved = resolveImage(value);
  const currentRef = value;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file again still fires a change event.
    event.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);
    if ('error' in result) {
      setUploadError(result.error);
      return;
    }
    onChange(result.ref);
  }

  return (
    <div className="border border-[#EDE6DC] bg-[#FBF8F2] p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#5C5349]">Picture</span>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 border border-[#C6934B] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-1.5 transition-colors hover:bg-[#C6934B]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{uploading ? 'Uploading…' : 'Upload a photo'}</span>
        </button>
        <input ref={fileInput} type="file" accept={ACCEPT} onChange={handleFile} className="hidden" aria-hidden="true" tabIndex={-1} />
      </div>

      <div className="flex items-start gap-4">
        <ProductThumb ref={currentRef} className="w-24 h-32" />
        <div className="flex-1 min-w-0">
          {resolved ? (
            <p className="text-xs text-[#5C5349] break-all leading-relaxed">
              {value.startsWith('bundled:')
                ? `Studio photo · ${value.slice('bundled:'.length)}`
                : value.startsWith('shop:')
                  ? 'Your uploaded photo'
                  : 'Linked picture'}
            </p>
          ) : (
            <p className="text-xs text-[#5C5349] flex items-center gap-1.5">
              <ImageOff className="w-3.5 h-3.5" /> No picture selected.
            </p>
          )}
          <p className="text-[11px] text-[#5C5349] mt-2">
            Picking or uploading a picture does not change the live shop until you press Save.
          </p>
        </div>
      </div>

      {uploadError && (
        <p className="text-xs text-[#A8523C]" role="status">
          {uploadError}
        </p>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#5C5349] mb-2">Studio photos</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {bundledImageOptions().map((option) => {
            const ref = `bundled:${option.key}`;
            const selected = value === ref;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={selected}
                aria-label={`Use studio photo ${option.key}`}
                onClick={() => onChange(ref)}
                className={`relative aspect-[3/4] overflow-hidden border transition-all ${
                  selected ? 'border-[#C6934B] ring-2 ring-[#C6934B]/40' : 'border-[#EDE6DC] hover:border-[#C6934B]'
                }`}
              >
                <img src={option.src} alt="" loading="lazy" className="w-full h-full object-cover object-top" />
                {selected && (
                  <span className="absolute inset-x-0 bottom-0 bg-[#C6934B] text-[#FDFBF7] text-[9px] uppercase tracking-[0.15em] py-0.5 text-center">
                    In use
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
