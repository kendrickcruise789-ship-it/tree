import React from 'react';
import { CATEGORIES } from '../data/products';
import { SlidersHorizontal, Filter } from 'lucide-react';

interface CategoryNavProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  itemCount: number;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  itemCount,
  onOpenFilters,
  activeFilterCount,
}) => {
  return (
    <div className="border-b border-[#EDE6DC] bg-[#FDFBF7] sticky top-20 z-30 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const isSale = cat === 'Sale';
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 text-xs uppercase tracking-wider font-medium whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#1E1B18] text-[#FDFBF7]'
                    : isSale
                    ? 'text-[#A8523C] hover:bg-[#F3EFEA]'
                    : 'text-[#5C5349] hover:text-[#1E1B18] hover:bg-[#F3EFEA]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Right: Filters Trigger & Sort Selector */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 text-xs text-[#5C5349]">
          
          {/* Filter button */}
          <button
            onClick={onOpenFilters}
            className={`px-3 py-1.5 border text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors ${
              activeFilterCount > 0
                ? 'border-[#1E1B18] bg-[#1E1B18] text-[#FDFBF7]'
                : 'border-[#D5C9B9] bg-white text-[#1E1B18] hover:border-[#1E1B18]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#1E1B18] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Item count */}
          <span className="hidden sm:inline font-light border-l border-[#EDE6DC] pl-3">
            <strong className="font-semibold text-[#1E1B18]">{itemCount}</strong> items
          </span>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 border-l border-[#EDE6DC] pl-3">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#7A6B5D]" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-xs text-[#1E1B18] font-medium tracking-wide focus:outline-none cursor-pointer py-1"
              aria-label="Sort products"
            >
              <option value="featured">Featured Curations</option>
              <option value="newest">Newest Drops</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

