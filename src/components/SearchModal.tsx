import React, { useState, useMemo } from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { resolveImage } from '../shop/schema';
import { SafeImage } from './SafeImage';
import { Search, X, ArrowRight } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface SearchModalProps {
  isOpen: boolean;
  products: Product[];
  currency: Currency;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  products,
  currency,
  onClose,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  const quickTags = ['Mulmul Dress', 'Indigo Co-ord', 'Chanderi', 'Terracotta Tunic', 'Anarkali'];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Match every word, so multi-word chips like "Mulmul Dress" work:
    // a product qualifies when each term appears somewhere in its record.
    const terms = q.split(/\s+/);
    return products.filter((p) => {
      const haystack = [
        p.title,
        p.category,
        p.fabric,
        p.craftTechnique,
        p.description,
        ...p.colors.map((c) => c.name),
      ]
        .join(' ')
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, query]);

  useOverlayBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] border border-[#EDE6DC] shadow-2xl p-6 sm:p-8 max-h-[80vh] flex flex-col">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#1E1B18] pb-3">
          <Search className="w-5 h-5 text-[#7A6B5D] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by silhouette, fabric, or craft (e.g. Mulmul, Indigo)..."
            className="w-full bg-transparent text-base sm:text-lg text-[#1E1B18] placeholder-[#A89C8F] focus:outline-none font-serif"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#7A6B5D] hover:text-[#1E1B18]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1 text-[#7A6B5D] hover:text-[#1E1B18]"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Tag Suggestions */}
        {!query && (
          <div className="py-6 space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-[#7A6B5D] font-medium">
              Popular Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 bg-[#FAF7F2] border border-[#EDE6DC] text-xs text-[#5C5349] hover:bg-[#1E1B18] hover:text-white transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Search Results */}
        {query && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 divide-y divide-[#EDE6DC]">
            <p className="text-xs text-[#7A6B5D] pt-1">
              Found <strong>{filtered.length}</strong> matching silhouettes:
            </p>

            {filtered.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="font-serif text-lg text-[#1E1B18]">No matches found for "{query}"</p>
                <p className="text-xs text-[#7A6B5D]">Try searching for "Dress", "Co-ord", or "Chanderi"</p>
              </div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    onClose();
                  }}
                  className="pt-3 pb-2 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F2] p-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={resolveImage(p.image)}
                      alt={p.title}
                      category={p.category}
                      fallbackLabel={p.title}
                      className="w-12 h-14 object-cover bg-[#EDE6DC]"
                    />
                    <div>
                      <p className="font-serif text-sm font-medium text-[#1E1B18]">{p.title}</p>
                      <p className="text-[11px] text-[#7A6B5D] uppercase tracking-wider">{p.category} · {p.fabric}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold tabular-nums text-[#1E1B18]">
                      {formatPrice(p.price, currency)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#7A6B5D]" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
