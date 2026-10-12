import React, { useEffect, useRef, useState } from 'react';
import { SitePage, UserAccount } from '../types';
import { categoryLabel } from '../data/products';
import { Search, Heart, ShoppingBag, Menu, X, User, LogOut, Package } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  currentUser: UserAccount | null;
  page: SitePage;
  onSelectPage: (page: SitePage) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTracking: () => void;
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  currentUser,
  page,
  onSelectPage,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenAuth,
  onLogout,
  onOpenTracking,
  onSelectCategory,
  activeCategory,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Dismiss the account menu on outside click or Escape
  useEffect(() => {
    if (!userDropdownOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userDropdownOpen]);

  const navLinks = [
    { label: 'All', category: 'All Collections' },
    { label: 'Dresses', category: 'Dresses' },
    { label: 'Co-ords', category: 'Co-ords' },
    { label: 'Kurtas & Tunics', category: 'Kurtas & Tunics' },
    { label: 'Kaftans', category: 'Kaftans' },
    { label: 'Bedsheets', category: 'Bedsheets' },
    { label: categoryLabel('Home'), category: 'Home' },
    { label: 'Gifts', category: 'Gifts' },
    { label: 'Sale', category: 'Sale' },
  ];

  // Category links always land on the Clothing page, whichever page they were clicked from
  const handleNavClick = (link: { label: string; category?: string; href?: string }) => {
    if (link.category) {
      onSelectCategory(link.category);
      const el = document.getElementById('catalog-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (link.href) {
      const el = document.querySelector(link.href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handlePageClick = (nextPage: SitePage) => {
    onSelectPage(nextPage);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EDE6DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
        
        {/* Mobile menu trigger */}
        <div className="flex items-center xl:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-[#1E1B18] hover:text-[#7A6B5D] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handlePageClick('home');
          }}
          className="font-serif text-xl sm:text-2xl md:text-3xl tracking-[0.22em] sm:tracking-[0.3em] font-medium text-[#1E1B18] uppercase whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
        >
          RAMBAGH
        </a>

        {/* Primary page switch: Home (the house) vs Clothing (the shop) */}
        <nav aria-label="Site sections" className="hidden sm:flex items-center gap-1 lg:gap-2 shrink-0">
          {(['home', 'clothing'] as SitePage[]).map((nextPage) => {
            const isActive = page === nextPage;
            return (
              <button
                key={nextPage}
                onClick={() => handlePageClick(nextPage)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-2 sm:px-3 py-2 text-[11px] xl:text-[13px] uppercase tracking-[0.18em] font-medium transition-colors ${
                  isActive ? 'text-[#1E1B18]' : 'text-[#7A6B5D] hover:text-[#1E1B18]'
                }`}
              >
                {nextPage === 'home' ? 'Home' : 'Clothing'}
                <span
                  aria-hidden="true"
                  className={`absolute left-2 right-2 bottom-1 h-[2px] bg-[#C6934B] origin-left transition-transform duration-300 ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 2: Category links — scrollable so they can never push the bag button off screen */}
        <nav className="hidden xl:flex items-center gap-6 min-w-0 flex-1 overflow-x-auto no-scrollbar text-[12px] tracking-wider uppercase font-medium text-[#5C5349]">
          {navLinks.map((link) => {
            const isActive = link.category && activeCategory === link.category;
            const isSale = link.category === 'Sale';
            return (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                  isSale ? 'text-[#A8523C] font-semibold' : ''
                } ${
                  isActive
                    ? 'text-[#1E1B18] font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-[#1E1B18]'
                    : 'hover:text-[#1E1B18]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          
          {/* User Account / Login */}
          <div className="relative">
            {currentUser ? (
              <div ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label={`Account menu for ${currentUser.fullName}`}
                  aria-expanded={userDropdownOpen}
                  className="flex items-center gap-1.5 p-1.5 text-xs text-[#1E1B18] hover:text-[#7A6B5D] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1E1B18] text-[#FDFBF7] flex items-center justify-center text-[10px] font-semibold uppercase">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <span className="hidden xl:inline text-xs font-medium max-w-[80px] truncate">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#FDFBF7] border border-[#EDE6DC] shadow-xl py-2 z-50 text-xs animate-in fade-in">
                    <div className="px-4 py-2 border-b border-[#F2ECE3]">
                      <p className="font-semibold text-[#1E1B18] truncate">{currentUser.fullName}</p>
                      <p className="text-[10px] text-[#7A6B5D] truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenTracking();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#FAF7F2] flex items-center gap-2 text-[#5C5349]"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#FAF7F2] flex items-center gap-2 text-[#A8523C]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-1.5 sm:p-2 text-[#1E1B18] hover:text-[#7A6B5D] transition-colors flex items-center gap-1 text-xs"
                aria-label="Account login"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xl:inline uppercase tracking-wider text-[11px] font-medium">Login</span>
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:p-2 text-[#1E1B18] hover:text-[#7A6B5D] transition-colors relative"
            aria-label="Search collection"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="p-1.5 sm:p-2 text-[#1E1B18] hover:text-[#7A6B5D] transition-colors relative"
            aria-label="View wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#A8523C] text-white text-[10px] font-medium flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Bag Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-1.5 sm:gap-2 pl-2.5 pr-3 sm:pl-3 sm:pr-4 py-2 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-widest font-medium hover:bg-[#342F2A] transition-all shrink-0"
            aria-label="View bag"
          >
            <ShoppingBag className="w-4 h-4 text-[#E8DDD1]" />
            <span className="hidden sm:inline">Bag</span>
            <span className="text-[#E8DDD1]">({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#EDE6DC] bg-[#FDFBF7] px-6 py-6 space-y-5 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2">
            {(['home', 'clothing'] as SitePage[]).map((nextPage) => {
              const isActive = page === nextPage;
              return (
                <button
                  key={nextPage}
                  onClick={() => handlePageClick(nextPage)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-3 text-[11px] uppercase tracking-[0.2em] font-medium border transition-colors ${
                    isActive
                      ? 'border-[#1E1B18] bg-[#1E1B18] text-[#FDFBF7]'
                      : 'border-[#D5C9B9] text-[#5C5349] hover:border-[#1E1B18] hover:text-[#1E1B18]'
                  }`}
                >
                  {nextPage === 'home' ? 'Home' : 'Clothing'}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col space-y-3 text-sm tracking-wider uppercase font-medium text-[#4A4239]">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className={`text-left py-2 border-b border-[#F4EFEA] hover:text-[#1E1B18] transition-colors ${
                  link.category === 'Sale' ? 'text-[#A8523C] font-semibold' : ''
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-[#7A6B5D]">
            <span>Handcrafted Apparel & Home</span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!currentUser) onOpenAuth();
              }}
              className="font-medium text-[#1E1B18] underline"
            >
              {currentUser ? `Hi, ${currentUser.fullName}` : 'Sign In'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
