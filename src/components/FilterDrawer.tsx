import React from 'react';
import { FilterOptions, Currency } from '../types';
import { categoryLabel, ALL_FABRICS, ALL_SIZES, ALL_COLORS, MAX_PRICE_CEILING } from '../data/products';
import { formatPrice } from '../utils/currency';
import { X, RotateCcw, Check } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface FilterDrawerProps {
  isOpen: boolean;
  filters: FilterOptions;
  currency: Currency;
  /** Top of the price slider. Defaults to the baked catalogue's most expensive piece. */
  priceCeiling?: number;
  /** Categories the shop actually sells, so an owner-created one appears without a rebuild. */
  categories: string[];
  onClose: () => void;
  onUpdateFilters: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  filters,
  currency,
  priceCeiling = MAX_PRICE_CEILING,
  categories,
  onClose,
  onUpdateFilters,
  onResetFilters,
  totalResultsCount,
}) => {
  useOverlayBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const handleCategoryClick = (cat: string) => {
    onUpdateFilters({
      ...filters,
      category: cat,
      onSaleOnly: cat === 'Sale',
      sizes: [],
      fabrics: [],
      colors: [],
    });
  };

  const handleToggleFabric = (fabric: string) => {
    const next = filters.fabrics.includes(fabric)
      ? filters.fabrics.filter((f) => f !== fabric)
      : [...filters.fabrics, fabric];
    onUpdateFilters({ ...filters, fabrics: next });
  };

  const handleToggleSize = (size: string) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onUpdateFilters({ ...filters, sizes: next });
  };

  const handleToggleColor = (colorName: string) => {
    const next = filters.colors.includes(colorName)
      ? filters.colors.filter((c) => c !== colorName)
      : [...filters.colors, colorName];
    onUpdateFilters({ ...filters, colors: next });
  };

  const activeFiltersCount =
    (filters.category !== 'All Collections' ? 1 : 0) +
    filters.fabrics.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.onSaleOnly ? 1 : 0) +
    (filters.maxPrice < priceCeiling || filters.minPrice > 0 ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Refine collection"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-[#EDE6DC]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#EDE6DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#1E1B18]">Refine Collection</h2>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#1E1B18] text-white text-[10px] font-medium flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <button
                onClick={onResetFilters}
                className="text-xs text-[#A8523C] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. Category */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1E1B18]">
              Department / Category
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = filters.category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-3 py-1.5 text-xs transition-colors border ${
                      isSelected
                        ? 'bg-[#1E1B18] text-[#FDFBF7] border-[#1E1B18]'
                        : 'bg-white text-[#5C5349] border-[#EDE6DC] hover:border-[#B8ACA0]'
                    }`}
                  >
                    {categoryLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Price Range */}
          <div className="space-y-3 pt-4 border-t border-[#EDE6DC]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1E1B18]">
                Price Range
              </h3>
              <span className="text-xs text-[#7A6B5D] tabular-nums font-medium">
                {formatPrice(filters.minPrice, currency)} — {formatPrice(filters.maxPrice, currency)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={priceCeiling}
              step="5"
              value={filters.maxPrice}
              aria-label="Maximum price"
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  maxPrice: Number(e.target.value),
                })
              }
              className="w-full accent-[#1E1B18] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#A89C8F]">
              <span>{formatPrice(0, currency)}</span>
              <span>{formatPrice(priceCeiling / 2, currency)}</span>
              <span>{formatPrice(priceCeiling, currency)}+</span>
            </div>
          </div>

          {/* 3. Fabrics & Weaves */}
          <div className="space-y-2.5 pt-4 border-t border-[#EDE6DC]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1E1B18]">
              Artisanal Fabric
            </h3>
            <div className="space-y-2">
              {ALL_FABRICS.map((fabric) => {
                const isChecked = filters.fabrics.includes(fabric);
                return (
                  <label
                    key={fabric}
                    className="flex items-center gap-2.5 text-xs text-[#5C5349] cursor-pointer hover:text-[#1E1B18]"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleFabric(fabric)}
                      className="rounded text-[#1E1B18] focus:ring-0"
                    />
                    <span>{fabric}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Color Swatches */}
          <div className="space-y-2.5 pt-4 border-t border-[#EDE6DC]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1E1B18]">
              Dye & Color Palette
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_COLORS.map((col) => {
                const isSelected = filters.colors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleToggleColor(col.name)}
                    className={`p-2 flex items-center gap-2 border text-xs text-left transition-all ${
                      isSelected
                        ? 'border-[#1E1B18] bg-[#F4EFEA] font-medium text-[#1E1B18]'
                        : 'border-[#EDE6DC] bg-white text-[#5C5349] hover:border-[#D5C9B9]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="truncate">{col.name}</span>
                    {isSelected && <Check className="w-3 h-3 ml-auto text-[#1E1B18]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Sizes & Dimensions */}
          <div className="space-y-2.5 pt-4 border-t border-[#EDE6DC]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1E1B18]">
              Size & Measurements
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SIZES.map((sz) => {
                const isSelected = filters.sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    onClick={() => handleToggleSize(sz)}
                    className={`px-3 py-1 text-xs border transition-colors ${
                      isSelected
                        ? 'bg-[#1E1B18] text-white border-[#1E1B18]'
                        : 'bg-white text-[#5C5349] border-[#EDE6DC] hover:border-[#B8ACA0]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Quick Toggles */}
          <div className="space-y-3 pt-4 border-t border-[#EDE6DC]">
            <label className="flex items-center justify-between text-xs text-[#5C5349] cursor-pointer">
              <span>Show In-Stock Silhouettes Only</span>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) =>
                  onUpdateFilters({
                    ...filters,
                    inStockOnly: e.target.checked,
                  })
                }
                className="rounded text-[#1E1B18] focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-[#5C5349] cursor-pointer">
              <span>Show Archive & Markdown Drops Only</span>
              <input
                type="checkbox"
                checked={filters.onSaleOnly}
                onChange={(e) =>
                  onUpdateFilters({
                    ...filters,
                    onSaleOnly: e.target.checked,
                  })
                }
                className="rounded text-[#1E1B18] focus:ring-0"
              />
            </label>
          </div>

        </div>

        {/* Footer Apply CTA */}
        <div className="p-5 border-t border-[#EDE6DC] bg-white">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all"
          >
            Show {totalResultsCount} Handcrafted Pieces
          </button>
        </div>

      </div>
    </div>
  );
};
