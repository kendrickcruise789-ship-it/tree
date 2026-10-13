import React, { useState } from 'react';
import { Currency, GST_RATES, Product, ProductColor } from '../../types';
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
import { LoaderCircle, Save, RefreshCw, CircleAlert, CircleCheck, Trash2, Plus, X } from 'lucide-react';

interface ProductEditorProps {
  /** The product the editor was opened from — used to seed the form and to rebuild on save. */
  base: Product;
  mode: 'edit' | 'create';
  currency: Currency;
  /** Categories already in the shop, plus the built-in ones. */
  categories: string[];
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

const sectionClass = 'space-y-3';

const headingClass = 'text-[11px] uppercase tracking-[0.22em] text-[#1E1B18] pb-2 border-b border-[#EDE6DC]';

const SIZE_SUGGESTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free', 'Standard', 'Single', 'Queen', 'King', 'Set of 2'];

export const ProductEditor: React.FC<ProductEditorProps> = ({
  base,
  mode,
  currency,
  categories,
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
  const [newSize, setNewSize] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const errors = validateForm(form);
  const valid = !hasErrors(errors);
  const needsReload = isStaleRevisionMessage(error) || unknownOutcome;

  function patch(next: Partial<ProductForm>) {
    setForm((prev) => ({ ...prev, ...next }));
  }
  function patchStock(size: string, value: string) {
    setForm((prev) => ({ ...prev, stockBySize: { ...prev.stockBySize, [size]: value } }));
  }

  function addSize(candidate: string) {
    const size = candidate.trim();
    if (!size || form.sizes.some((s) => s.toLowerCase() === size.toLowerCase())) return;
    if (form.sizes.length >= 12) return;
    setForm((prev) => ({
      ...prev,
      sizes: [...prev.sizes, size],
      stockBySize: { ...prev.stockBySize, [size]: prev.stockBySize[size] ?? '0' },
    }));
    setNewSize('');
  }

  function removeSize(size: string) {
    setForm((prev) => {
      const stockBySize = { ...prev.stockBySize };
      delete stockBySize[size];
      return { ...prev, sizes: prev.sizes.filter((s) => s !== size), stockBySize };
    });
  }

  function patchColor(index: number, next: Partial<ProductColor>) {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((color, i) => (i === index ? { ...color, ...next } : color)),
    }));
  }

  function addColor() {
    if (form.colors.length >= 8) return;
    patch({ colors: [...form.colors, { name: '', hex: '#EDE8DF' }] });
  }

  function removeColor(index: number) {
    patch({ colors: form.colors.filter((_, i) => i !== index) });
  }

  function handleSave() {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    onSave(buildProduct(base, form));
  }

  const showFieldErrors = showErrors || !valid;
  const categoryValue = form.newCategory.trim() || form.category;
  const unusedSuggestions = SIZE_SUGGESTIONS.filter(
    (s) => !form.sizes.some((existing) => existing.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="border border-[#C6934B]/40 bg-[#FDFBF7] shadow-[0_1px_0_rgba(0,0,0,0.02)] p-4 sm:p-6 space-y-7">
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
          className="p-2 text-[#5C5349] hover:text-[#1E1B18] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Publishing state decides who can see this piece */}
      <div className={sectionClass}>
        <p className={headingClass}>Availability</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <ChoiceRadio
            name={`status-${base.id}`}
            checked={form.status === 'published'}
            onChange={() => patch({ status: 'published' })}
            label="Published — shoppers can buy it"
          />
          <ChoiceRadio
            name={`status-${base.id}`}
            checked={form.status === 'draft'}
            onChange={() => patch({ status: 'draft' })}
            label="Draft — hidden from shoppers"
          />
        </div>
        <p className="text-xs text-[#5C5349]">
          Drafts stay invisible on the storefront and in search, but they hold real stock figures so you can fill a
          product in over several sittings.
        </p>
      </div>

      {/* Basics */}
      <div className={sectionClass}>
        <p className={headingClass}>Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
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
              placeholder="e.g. Cotton mul, hand block printed"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`craft-${base.id}`}>
              How it is made
            </label>
            <input
              id={`craft-${base.id}`}
              type="text"
              value={form.craftTechnique}
              onChange={(e) => patch({ craftTechnique: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`care-${base.id}`}>
              Care instructions
            </label>
            <input
              id={`care-${base.id}`}
              type="text"
              value={form.careInstructions}
              onChange={(e) => patch({ careInstructions: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`fit-${base.id}`}>
              Fit note
            </label>
            <input
              id={`fit-${base.id}`}
              type="text"
              value={form.fitNote}
              onChange={(e) => patch({ fitNote: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Category, including owner-created ones */}
      <div className={sectionClass}>
        <p className={headingClass}>Category</p>
        {!addingCategory ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className={labelClass} htmlFor={`category-${base.id}`}>
                Shop category
              </label>
              <select
                id={`category-${base.id}`}
                value={form.category}
                onChange={(e) => patch({ category: e.target.value, newCategory: '' })}
                className={inputClass}
              >
                {/* A category the owner just invented is not in the shop list yet, but the
                    select must still show it or the choice looks like it was ignored. */}
                {(categories.includes(form.category) ? categories : [...categories, form.category]).map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-2 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New category
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className={labelClass} htmlFor={`newcat-${base.id}`}>
              New category name
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id={`newcat-${base.id}`}
                type="text"
                autoFocus
                value={form.newCategory}
                onChange={(e) => patch({ newCategory: e.target.value })}
                className={`${inputClass} max-w-xs`}
                placeholder="e.g. Sarees"
              />
              <button
                type="button"
                onClick={() => {
                  patch({ category: form.newCategory.trim() || form.category, newCategory: '' });
                  setAddingCategory(false);
                }}
                className="text-[12px] uppercase tracking-[0.12em] text-[#1E1B18] hover:text-[#C6934B] transition-colors px-2 py-2"
              >
                Use it
              </button>
              <button
                type="button"
                onClick={() => {
                  patch({ newCategory: '' });
                  setAddingCategory(false);
                }}
                className="text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-2 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-[#5C5349]">Shown to shoppers as <strong className="font-medium">{categoryLabel(categoryValue)}</strong>.</p>
        {showFieldErrors && errors.category && <FieldError>{errors.category}</FieldError>}
      </div>

      {/* Pricing */}
      <div className={sectionClass}>
        <p className={headingClass}>Pricing</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor={`price-${base.id}`}>
              Selling price
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
            {valid && (
              <p className="text-xs text-[#5C5349] mt-1">
                Shoppers paying in {currency} see {formatPrice(Number(form.price) || 0, currency)}.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor={`compare-${base.id}`}>
              Compare-at price (blank for none)
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

          <div>
            <label className={labelClass} htmlFor={`sku-${base.id}`}>
              SKU / product code
            </label>
            <input
              id={`sku-${base.id}`}
              type="text"
              value={form.sku}
              onChange={(e) => patch({ sku: e.target.value })}
              className={inputClass}
              placeholder="Your own code"
            />
            {showFieldErrors && errors.sku && <FieldError>{errors.sku}</FieldError>}
          </div>

          <div>
            <label className={labelClass} htmlFor={`hsn-${base.id}`}>
              HSN / SAC code
            </label>
            <input
              id={`hsn-${base.id}`}
              type="text"
              value={form.hsnCode}
              onChange={(e) => patch({ hsnCode: e.target.value })}
              className={inputClass}
              placeholder="For GST invoices"
            />
            {showFieldErrors && errors.hsnCode && <FieldError>{errors.hsnCode}</FieldError>}
          </div>

          <div>
            <label className={labelClass} htmlFor={`gst-${base.id}`}>
              GST rate
            </label>
            <select
              id={`gst-${base.id}`}
              value={form.gstPercent}
              onChange={(e) => patch({ gstPercent: e.target.value })}
              className={inputClass}
            >
              <option value="">Not set</option>
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
            {showFieldErrors && errors.gstPercent && <FieldError>{errors.gstPercent}</FieldError>}
          </div>

          <div>
            <label className={labelClass} htmlFor={`weight-${base.id}`}>
              Packaged weight (grams)
            </label>
            <input
              id={`weight-${base.id}`}
              type="text"
              inputMode="numeric"
              value={form.weightGrams}
              onChange={(e) => patch({ weightGrams: e.target.value })}
              className={inputClass}
              placeholder="Courier tariff basis"
            />
            {showFieldErrors && errors.weightGrams && <FieldError>{errors.weightGrams}</FieldError>}
          </div>
        </div>
      </div>

      {/* Sizes and stock — the owner now owns the size list, not just the counts */}
      <div className={sectionClass}>
        <p className={headingClass}>Sizes and stock</p>
        <div className="flex flex-wrap gap-2">
          {form.sizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-1 border border-[#1E1B18] text-[#1E1B18] text-xs px-2 py-1"
            >
              {size}
              <button
                type="button"
                onClick={() => removeSize(size)}
                aria-label={`Remove size ${size}`}
                className="text-[#5C5349] hover:text-[#A8523C] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className={labelClass} htmlFor={`newsize-${base.id}`}>
              Add a size
            </label>
            <input
              id={`newsize-${base.id}`}
              type="text"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSize(newSize);
                }
              }}
              className={`${inputClass} max-w-[180px]`}
              placeholder="e.g. XL or 72x84"
            />
          </div>
          <button
            type="button"
            onClick={() => addSize(newSize)}
            className="inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-2 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          {unusedSuggestions.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSize(suggestion)}
              className="text-xs text-[#5C5349] hover:text-[#C6934B] transition-colors px-2 py-2"
            >
              + {suggestion}
            </button>
          ))}
        </div>
        {showFieldErrors && errors.sizes && <FieldError>{errors.sizes}</FieldError>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {form.sizes.map((size) => (
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

      {/* Colours */}
      <div className={sectionClass}>
        <p className={headingClass}>Colours offered</p>
        <ul className="space-y-2">
          {form.colors.map((color, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : '#EDE8DF'}
                onChange={(e) => patchColor(index, { hex: e.target.value })}
                aria-label={`Colour ${index + 1} swatch`}
                className="w-10 h-10 border border-[#EDE6DC] bg-[#FDFBF7] p-1"
              />
              <input
                type="text"
                value={color.name}
                onChange={(e) => patchColor(index, { name: e.target.value })}
                aria-label={`Colour ${index + 1} name`}
                placeholder="Colour name"
                className={`${inputClass} flex-1 min-w-[160px] max-w-xs`}
              />
              <button
                type="button"
                onClick={() => removeColor(index)}
                aria-label={`Remove colour ${color.name || index + 1}`}
                className="p-2 text-[#A8523C] hover:text-[#8a3f2d] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addColor}
          disabled={form.colors.length >= 8}
          className="inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-2 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add colour
        </button>
        {showFieldErrors && errors.colors && <FieldError>{errors.colors}</FieldError>}
      </div>

      {/* Pictures */}
      <div className={sectionClass}>
        <p className={headingClass}>Pictures</p>
        <ImagePicker values={form.images} onChange={(images) => patch({ images })} />
        {showFieldErrors && errors.images && <FieldError>{errors.images}</FieldError>}
      </div>

      {/* Flags */}
      <fieldset className={sectionClass}>
        <legend className={headingClass}>Markers</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
          <FlagCheckbox checked={form.isNew} onChange={(v) => patch({ isNew: v })} label="New arrival" />
          <FlagCheckbox checked={form.isBest} onChange={(v) => patch({ isBest: v })} label="Bestseller" />
          <FlagCheckbox checked={form.onSale} onChange={(v) => patch({ onSale: v })} label="On sale" />
        </div>
      </fieldset>

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
                className="self-start inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-2 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
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
          className="inline-flex items-center gap-2 bg-[#1E1B18] text-[#FDFBF7] text-[12px] uppercase tracking-[0.14em] px-5 py-3 hover:bg-[#342F2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-3 py-3"
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
  <label className="inline-flex items-center gap-2 text-sm text-[#1E1B18] cursor-pointer select-none py-1">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-[#C6934B]"
    />
    {label}
  </label>
);

const ChoiceRadio: React.FC<{
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}> = ({ name, checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 text-sm text-[#1E1B18] cursor-pointer select-none py-1">
    <input type="radio" name={name} checked={checked} onChange={onChange} className="w-4 h-4 accent-[#C6934B]" />
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
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[#A8523C] hover:text-[#8a3f2d] transition-colors px-3 py-3 disabled:opacity-50"
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
        className="bg-[#A8523C] text-[#FDFBF7] text-[12px] uppercase tracking-[0.12em] px-3 py-2 hover:bg-[#8a3f2d] transition-colors disabled:opacity-50"
      >
        Yes, retire it
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-3 py-2"
      >
        Keep it
      </button>
    </div>
  );
};
