import React, { useState, useEffect } from 'react';
import { X, Search, Package, CheckCircle2, Truck, Clock } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const [orderQuery, setOrderQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // The modal stays mounted while closed, so clear the previous lookup on reopen.
  useEffect(() => {
    if (isOpen) {
      setOrderQuery('');
      setHasSearched(false);
    }
  }, [isOpen]);

  useOverlayBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQuery.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Track your order"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-[#FDFBF7] border border-[#EDE6DC] shadow-2xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE6DC]">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#7A6B5D]" />
            <h2 className="font-serif text-2xl font-medium text-[#1E1B18]">Track Your Consignment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
            aria-label="Close tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSearch} className="my-6 space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[#5C5349] font-medium">
            Enter Order ID or Registered Email
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="e.g. CTX-84920 or your@email.com"
              className="flex-1 px-3 py-2 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-[#1E1B18] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#342F2A] transition-colors"
            >
              Track
            </button>
          </div>
        </form>

        {/* Results */}
        {hasSearched ? (
          <div className="p-4 bg-white border border-[#EDE6DC] space-y-4 animate-in fade-in">
            <p className="text-[11px] uppercase tracking-wider text-[#A8523C] font-medium">
              Demo shipment — this prototype is not connected to a courier API
            </p>
            <div className="flex items-center justify-between pb-3 border-b border-[#F4EFEA] text-xs">
              <div>
                <span className="text-[#7A6B5D]">Order: </span>
                <strong className="font-mono text-[#1E1B18]">{orderQuery.toUpperCase().startsWith('CTX') ? orderQuery.toUpperCase() : 'CTX-91840'}</strong>
              </div>
              <span className="text-[#2F6F4E] font-medium flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                In Transit (Express Air)
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#2F6F4E] shrink-0" />
                <div>
                  <p className="font-semibold text-[#1E1B18]">Order Confirmed & Payment Verified</p>
                  <p className="text-[#7A6B5D] text-[11px]">Jaipur Atelier Workshop · 2 days ago</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#2F6F4E] shrink-0" />
                <div>
                  <p className="font-semibold text-[#1E1B18]">Master Block Inspection & Eco Packaging</p>
                  <p className="text-[#7A6B5D] text-[11px]">Hand-pressed seal applied · Yesterday</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Truck className="w-4 h-4 text-[#C6934B] shrink-0" />
                <div>
                  <p className="font-semibold text-[#1E1B18]">Dispatched with Express Courier</p>
                  <p className="text-[#7A6B5D] text-[11px]">En route to sorting hub · Expected delivery in 48 hours</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#7A6B5D]">
            All Rambagh shipments are insured and tracked end-to-end with real-time delivery notifications.
          </p>
        )}

      </div>
    </div>
  );
};
