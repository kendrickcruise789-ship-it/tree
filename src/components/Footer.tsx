import React, { useState } from 'react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (category: string) => void;
  onOpenSizeGuide: () => void;
  onOpenTracking: () => void;
  onOpenOwner: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenSizeGuide,
  onOpenTracking,
  onOpenOwner,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#1E1B18] text-[#F3EFEA] pt-16 pb-12 border-t border-[#2D2924]">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Top Newsletter & Brand statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-[#2D2924] items-center">
          
          <div className="lg:col-span-6 space-y-3">
            <span className="font-serif text-3xl tracking-[0.25em] font-medium text-white uppercase block">
              RAMBAGH
            </span>
            <p className="text-xs text-[#B8ACA0] max-w-md font-light leading-relaxed">
              Mindfully handcrafted women's slow fashion apparel. Designed in timeless silhouettes, printed by master Rajasthani block printers, and shipped worldwide with carbon-neutral courier partners.
            </p>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#E8DDD1]">
              Join The Artisanal Circle
            </p>
            <p className="text-xs text-[#A89C8F]">
              Subscribe to receive exclusive access to small-batch drops and receive 10% off your first handcrafted order.
            </p>

            {subscribed ? (
              <div className="p-3 bg-[#2D2924] border border-[#3E3831] text-xs text-[#E8DDD1] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Welcome! Use code <strong className="font-mono text-white">RAMBAGH10</strong> at checkout for 10% off.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 px-4 py-2.5 text-xs bg-[#2D2924] border border-[#3E3831] text-white placeholder-[#7A6B5D] focus:outline-none focus:border-[#E8DDD1]"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FDFBF7] text-[#1E1B18] text-xs uppercase tracking-widest font-medium hover:bg-[#E8DDD1] transition-colors flex items-center gap-2"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          
          {/* Col 1 */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8DDD1]">
              Women's Apparel
            </p>
            <ul className="space-y-2 text-[#A89C8F]">
              <li>
                <button onClick={() => onSelectCategory('Dresses')} className="hover:text-white transition-colors">
                  Tiered & Maxi Dresses
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Co-ords')} className="hover:text-white transition-colors">
                  Linen & Cotton Co-ord Sets
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Kurtas & Tunics')} className="hover:text-white transition-colors">
                  Anarkalis & Handloom Tunics
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Kaftans')} className="hover:text-white transition-colors">
                  Mulmul Botanical Kaftans
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8DDD1]">
              Home & Gifting
            </p>
            <ul className="space-y-2 text-[#A89C8F]">
              <li>
                <button onClick={() => onSelectCategory('Bedsheets')} className="hover:text-white transition-colors">
                  Pure Percale Bedsheets
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Home')} className="hover:text-white transition-colors">
                  Cushions & Table Linen
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Gifts')} className="hover:text-white transition-colors">
                  Artisanal Gift Hampers
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Sale')} className="text-[#D8A49B] hover:text-white transition-colors font-medium">
                  Archive Sale & Markdowns
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8DDD1]">
              Patron Care
            </p>
            <ul className="space-y-2 text-[#A89C8F]">
              <li>
                <button onClick={onOpenSizeGuide} className="hover:text-white transition-colors">
                  Size Guide & Measurements
                </button>
              </li>
              <li>
                <button onClick={onOpenTracking} className="hover:text-white transition-colors">
                  Track Consignment
                </button>
              </li>
              <li>
                <button onClick={onOpenOwner} className="hover:text-white transition-colors">
                  Shop Owner Panel
                </button>
              </li>
              <li className="text-[#8D8275]">
                Complimentary Shipping &amp; Returns
              </li>
              <li className="text-[#8D8275]">
                Washing &amp; Textile Preservation
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8DDD1]">
              Payment screens
            </p>
            <p className="text-[#A89C8F] leading-relaxed text-[11px]">
              Card, UPI and cash-on-delivery screens here are a demonstration: nothing is
              charged, and no email or SMS is sent.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[#7A6B5D] text-[10px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F6F4E]" />
              <span>Demo storefront</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#2D2924] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6B5D]">
          <p>© {new Date().getFullYear()} Rambagh Clothing Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-[#8D8275]">Privacy Charter</span>
            <span className="text-[#8D8275]">Terms of Service</span>
            <span className="text-[#8D8275]">Artisan Verification</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
