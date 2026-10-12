import React, { useState } from 'react';
import { Currency, Product } from '../../types';
import { EDITABLE_CATEGORIES } from '../../shop/schema';
import { categoryLabel } from '../../data/products';
import { formatPrice } from '../../utils/currency';
import {
  buildProduct,
  formFromProduct,
  hasErrors,
  isStaleRevisionMessage,
  ProductForm,
  validateForm,
} from './validation';
import { ImagePicker } from './ImagePicker';
import { LoaderCircle, Save, RefreshCw, CircleAlert, CircleCheck, Trash2, X } from 'lucide-react';

interface ProductEditorProps {
  /** The product the editor was opened from — used to seed the form and to rebuild on save. */
  base: Product;
  mode: 'edit' | 'create';
  currency: Currency;
  saving: boolean;
  error: string | null;
  unknownOutcome: boolean;
  savedFlash: boolean;
  onReload?: () => void;
  onSave: (product: Product) => void;
  onRetire: (id: string) => void;
  onClose: () => void;
}

const inputClass =
  'w-full bg-[#FDFBF7] border border-[#EDE6DC] px-3 py-2 text-sm text-[#1E1B18] placeholder:text-[#A89C8F] focus:outline-none focus:border-[#C6934B] focus:ring-1 focus:ring-[#C6934B]/40 transition-colors';

const labelClass = 'block text-[11px] uppercase tracking-[0.2em] text-[#5C5349] mb-1.5';

export const ProductEditor: React.FC<ProductEditorProps> = ({
  base,
  mode,
  currency,
  saving,
  error,
  unknownOutcome,
  savedFlash,
  onReload,
  onSave,
  onRetire,
  onClose,
}) => {
  const [form, setForm] = useState<ProductForm>(() => formFromProduct(base));
  const [showErrors, setShowErrors] = useState(false);
  const [retireArmed, setRetireArmed] = useState(false);

  const errors = validateForm(form);
  const valid = !hasErrors(errors);
  const needsReload = isStaleRevisionMessage(error) || unknownOutcome;

  function patch(next: Partial<ProductForm>) {
    setForm((prev) => ({ ...prev, ...next }));
  }
  function patchStock(size: string, value: string) {
    setForm((prev) => ({ ...prev, stockBySize: { ...prev.stockBySize, [size]: value } }));
  }

  function handleSave() {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    onSave(buildProduct(base, form));
  }

  const showFieldErrors = showErrors || !valid;

  return (
    <div className="border border-[#C6934B]/40 bg-[#FDFBF7] shadow-[0_1px_0_rgba(0,0,0,0.02)] p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg text-[#1E1B18]">
            {mode === 'create' ? 'New product' : 'Edit product'}
          </h3>
          <p className="text-xs text-[#5C5349] mt-0.5 break-all">
            {base.id}
            {mode === 'create' && <span className="ml-2 uppercase tracking-[0.15em] text-[#C6934B]">New</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close editor"
          className="p-1.5 text-[#5C5349] hover:text-[#1E1B18] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Basics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`title-${base.id}`}>
            Title
          </label>
          <input
            id={`title-${base.id}`}
            type="text"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            className={inputClass}
          />
          {showFieldErrors && errors.title && <FieldError>{errors.title}</FieldError>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`desc-${base.id}`}>
            Description
          </label>
          <textarea
            id={`desc-${base.id}`}
            rows={3}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            className={inputClass}
          />
          {showFieldErrors && errors.description && <FieldError>{errors.description}</FieldError>}
        </div>

        <div>
          <label className={labelClass} htmlFor={`fabric-${base.id}`}>
            Fabric
          </label>
          <input
            id={`fabric-${base.id}`}
            type="text"
            value={form.fabric}
            onChange={(e) => patch({ fabric: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`category-${base.id}`}>
            Category
          </label>
          <select
            id={`category-${base.id}`}
            value={form.category}
            onChange={(e) => patch({ category: e.target.value as Product['category'] })}
            className={inputClass}
          >
            {EDITABLE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`price-${base.id}`}>
            Price (USD)
          </label>
          <input
            id={`price-${base.id}`}
            type="text"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => patch({ price: e.target.value })}
            className={inputClass}
          />
          {showFieldErrors && errors.price && <FieldError>{errors.price}</FieldError>}
          {valid && <p className="text-[11px] text-[#5C5349] mt-1">Shown to shoppers as {formatPrice(Number(form.price) || 0, currency)}.</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor={`compare-${base.id}`}>
            Compare-at price (optional, USD)
          </label>
          <input
            id={`compare-${base.id}`}
            type="text"
            inputMode="decimal"
            value={form.compareAt}
            onChange={(e) => patch({ compareAt: e.target.value })}
            className={inputClass}
            placeholder="Leave blank for none"
          />
          {showFieldErrors && errors.compareAt && <FieldError>{errors.compareAt}</FieldError>}
        </div>
      </div>

      {/* Stock — sizes are fixed, only the counts are editable */}
      <div>
        <span className={labelClass}>Stock by size</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {base.sizes.map((size) => (
            <div key={size}>
              <label className="block text-xs text-[#5C5349] mb-1" htmlFor={`stock-${base.id}-${size}`}>
                {size}
              </label>
              <input
                id={`stock-${base.id}-${size}`}
                type="text"
                inputMode="numeric"
                value={form.stockBySize[size] ?? ''}
                onChange={(e) => patchStock(size, e.target.value)}
                className={inputClass}
              />
              {showFieldErrors && errors.stock?.[size] && <FieldError>{errors.stock[size]}</FieldError>}
            </div>
          ))}
        </div>
      </div>

      {/* Flags */}
      <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
        <legend className={labelClass}>Markers</legend>
        <FlagCheckbox checked={form.isNew} onChange={(v) => patch({ isNew: v })} label="New arrival" />
        <FlagCheckbox checked={form.isBest} onChange={(v) => patch({ isBest: v })} label="Bestseller" />
        <FlagCheckbox checked={form.onSale} onChange={(v) => patch({ onSale: v })} label="On sale" />
      </fieldset>

      {/* Image */}
      <ImagePicker value={form.image} onChange={(ref) => patch({ image: ref })} />

      {/* Server status for this product */}
      <div aria-live="polite" className="space-y-2">
        {saving && (
          <p className="flex items-center gap-2 text-sm text-[#5C5349]">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Saving…
          </p>
        )}
        {!saving && error && (
          <div className="flex flex-col gap-2">
            <p className="flex items-start gap-2 text-sm text-[#A8523C]">
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
            {unknownOutcome && (
              <p className="text-xs text-[#5C5349]">
                This save may or may not have reached the shop. Reload to check the current price before editing again — do not save it twice.
              </p>
            )}
            {needsReload && onReload && (
              <button
                type="button"
                onClick={onReload}
                className="self-start inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload latest
              </button>
            )}
          </div>
        )}
        {!saving && !error && savedFlash && (
          <p className="flex items-center gap-2 text-sm text-[#C6934B]">
            <CircleCheck className="w-4 h-4" /> Saved
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#1E1B18] text-[#FDFBF7] text-[12px] uppercase tracking-[0.14em] px-5 py-2.5 hover:bg-[#342F2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          {mode === 'create' ? 'Create product' : 'Save changes'}
        </button>

        {mode === 'edit' ? (
          <RetireButton
            armed={retireArmed}
            disabled={saving}
            onArm={() => setRetireArmed(true)}
            onCancel={() => setRetireArmed(false)}
            onConfirm={() => onRetire(base.id)}
          />
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-2 py-2"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
};

const FieldError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="flex items-center gap-1.5 text-xs text-[#A8523C] mt-1.5">
    <CircleAlert className="w-3.5 h-3.5 shrink-0" />
    <span>{children}</span>
  </p>
);

const FlagCheckbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <label className="inline-flex items-center gap-2 text-sm text-[#1E1B18] cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-[#C6934B]"
    />
    {label}
  </label>
);

const RetireButton: React.FC<{
  armed: boolean;
  disabled: boolean;
  onArm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ armed, disabled, onArm, onCancel, onConfirm }) => {
  if (!armed) {
    return (
      <button
        type="button"
        onClick={onArm}
        disabled={disabled}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[#A8523C] hover:text-[#8a3f2d] transition-colors px-2 py-2 disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" /> Retire product
      </button>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <span className="text-xs text-[#5C5349]">Retire this piece from the shop?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="bg-[#A8523C] text-[#FDFBF7] text-[12px] uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#8a3f2d] transition-colors disabled:opacity-50"
      >
        Yes, retire it
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-2 py-1.5"
      >
        Keep it
      </button>
    </div>
  );
};
