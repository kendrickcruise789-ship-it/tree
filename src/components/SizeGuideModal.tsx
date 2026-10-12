import React, { useState } from 'react';
import { SIZE_CHART } from '../data/products';
import { X, Ruler } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  useOverlayBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const convertVal = (val: string): string => {
    if (unit === 'inches') return val;
    // e.g. "32-33" -> "81-84"
    if (val.includes('-')) {
      const [min, max] = val.split('-').map(Number);
      return `${Math.round(min * 2.54)}-${Math.round(max * 2.54)}`;
    }
    return `${Math.round(Number(val) * 2.54)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] border border-[#EDE6DC] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE6DC]">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#7A6B5D]" />
            <h2 className="font-serif text-2xl font-medium text-[#1E1B18]">Artisanal Fit & Sizing Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
            aria-label="Close size guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Selector */}
        <div className="my-6 flex items-center justify-between">
          <p className="text-xs text-[#7A6B5D]">
            All Rambagh silhouettes are designed with an easy, fluid drape. For a relaxed fit, choose your standard size.
          </p>
          <div className="flex items-center border border-[#D5C9B9] overflow-hidden text-xs">
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 font-medium transition-colors ${
                unit === 'inches' ? 'bg-[#1E1B18] text-white' : 'bg-white text-[#5C5349]'
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 font-medium transition-colors ${
                unit === 'cm' ? 'bg-[#1E1B18] text-white' : 'bg-white text-[#5C5349]'
              }`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-[#EDE6DC]">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-[#F4EFEA] uppercase tracking-wider text-[#5C5349] border-b border-[#EDE6DC]">
              <tr>
                <th className="py-3 px-4 font-semibold">Standard Size</th>
                <th className="py-3 px-4 font-semibold">Bust ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-4 font-semibold">Waist ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-4 font-semibold">Hips ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-4 font-semibold">Length ({unit === 'inches' ? 'in' : 'cm'})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE6DC] bg-white">
              {SIZE_CHART.map((row) => (
                <tr key={row.size} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#1E1B18]">{row.size}</td>
                  <td className="py-3 px-4 text-[#5C5349]">{convertVal(row.bustIn)}</td>
                  <td className="py-3 px-4 text-[#5C5349]">{convertVal(row.waistIn)}</td>
                  <td className="py-3 px-4 text-[#5C5349]">{convertVal(row.hipIn)}</td>
                  <td className="py-3 px-4 text-[#5C5349]">{convertVal(row.lengthIn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to measure tips */}
        <div className="mt-6 p-4 bg-[#F7F3ED] border border-[#E8DDD1] text-xs space-y-2 text-[#5C5349]">
          <p className="font-semibold text-[#1E1B18] uppercase tracking-wider text-[11px]">Measurement Guidelines</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Bust:</strong> Measure around the fullest part of your chest, keeping tape comfortably loose.</li>
            <li><strong>Waist:</strong> Measure around your natural waistline, just above your hip bones.</li>
            <li><strong>Hips:</strong> Measure around the widest part of your low hip with feet together.</li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-wider font-medium hover:bg-[#342F2A] transition-colors"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
