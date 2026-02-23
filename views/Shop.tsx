import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Star, Plus, X } from 'lucide-react';
import { Card, Badge, Button, SectionHeader } from '../components/UI';
import { INVENTORY } from '../constants';
import { storageService } from '../services/storage';
import { Shoe, Brand } from '../types';

interface ShopProps {
  onProductClick: (shoe: Shoe) => void;
  filteredMode?: boolean;
}

export const Shop: React.FC<ShopProps> = ({ onProductClick, filteredMode = false }) => {
  const [displayedInventory, setDisplayedInventory] = useState(INVENTORY);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
      brands: [] as string[],
      category: filteredMode ? 'Match' : 'All'
  });
  const profile = storageService.getProfile();

  useEffect(() => {
    let filtered = INVENTORY;

    // Apply Finder matches if triggered
    if (activeFilters.category === 'Match' && profile.isGuest === false) {
        const gait = storageService.getGaitProfile();
        filtered = filtered.filter(shoe => {
             let score = 0;
             const requiredScore = 2; // Threshold to be considered a match

             // 1. Terrain Match
             if (gait.terrain && shoe.category.includes(gait.terrain)) score += 2;
             if (gait.terrain === 'Hybrid' && (shoe.category === 'Trail' || shoe.category === 'Road')) score += 1;

             // 2. Stability / Pronation Match
             // High arch -> Neutral. Low arch -> Stability.
             // Pronation Over -> Stability.
             const needsStability = gait.pronation === 'Over' || gait.arch === 'Low';
             if (needsStability && shoe.support === 'Stability') score += 2;
             if (!needsStability && shoe.support === 'Neutral') score += 1;

             // 3. Injury History weighting
             // Plantar -> often benefits from structure or cushion.
             // Shin Splints -> max cushion.
             if (gait.injuryHistory?.includes('Shin') && shoe.cushion === 'Plush') score += 1;
             
             return score >= requiredScore;
        });
    } else if (activeFilters.category !== 'All' && activeFilters.category !== 'Match') {
        filtered = filtered.filter(s => s.category === activeFilters.category);
    }

    if (activeFilters.brands.length > 0) {
        filtered = filtered.filter(s => activeFilters.brands.includes(s.brand));
    }

    setDisplayedInventory(filtered);
  }, [activeFilters, profile.isGuest]);

  const toggleBrand = (brand: string) => {
      setActiveFilters(prev => ({
          ...prev,
          brands: prev.brands.includes(brand) 
            ? prev.brands.filter(b => b !== brand) 
            : [...prev.brands, brand]
      }));
  };

  const FilterDrawer = (
      <div className="fixed inset-0 z-[5000] flex justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="bg-[#111111] w-80 h-full relative z-10 p-6 flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-white">Filters</h2>
                  <button onClick={() => setShowFilters(false)}><X className="text-[#A0AEC0]" /></button>
              </div>
              
              <div className="space-y-6 flex-1">
                  <div>
                      <h3 className="text-sm font-bold text-[#A0AEC0] uppercase mb-3">Brands</h3>
                      <div className="space-y-2">
                          {['Saucony', 'Brooks', 'Hoka', 'New Balance', 'Altra'].map(brand => (
                              <label key={brand} className="flex items-center gap-3 text-white cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${activeFilters.brands.includes(brand) ? 'bg-[#e43928] border-[#e43928]' : 'border-white/20'}`}>
                                      {activeFilters.brands.includes(brand) && <Plus size={12} className="text-black rotate-45" />}
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={activeFilters.brands.includes(brand)}
                                    onChange={() => toggleBrand(brand)}
                                  />
                                  {brand}
                              </label>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                  <Button fullWidth onClick={() => setShowFilters(false)}>Show Results</Button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 relative pb-4">
      <div className="flex justify-between items-center">
         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1 mr-2">
            {!profile.isGuest && <button
                 onClick={() => setActiveFilters(prev => ({ ...prev, category: 'Match' }))}
                 className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilters.category === 'Match' ? 'bg-gradient-to-r from-[#ffffff] to-[#e43928] text-black' : 'bg-[#111111] text-[#A0AEC0]'}`}
            >
                My Matches
            </button>}
            {['All', 'Road', 'Trail'].map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveFilters(prev => ({ ...prev, category: cat }))}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${activeFilters.category === cat ? 'bg-white text-black' : 'bg-[#111111] text-[#A0AEC0]'}`}
                >
                    {cat}
                </button>
            ))}
        </div>
        <button onClick={() => setShowFilters(true)} className="p-2 bg-[#111111] rounded-full border border-white/10 text-white">
            <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {displayedInventory.map(shoe => (
            <div 
                key={shoe.id} 
                className="group relative flex flex-col cursor-pointer"
                onClick={() => onProductClick(shoe)}
            >
                <div className="aspect-square rounded-[24px] bg-[#111111] overflow-hidden mb-3 relative border border-white/5">
                    <img src={shoe.image} alt={shoe.name} referrerPolicy="no-referrer" className="w-full h-full object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    {shoe.isStaffPick && (
                        <div className="absolute top-2 left-2">
                            <Badge color="bg-[#e43928]">Staff Pick</Badge>
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <Plus size={16} className="text-white" />
                    </div>
                </div>
                <div>
                    <div className="text-xs text-[#A0AEC0] mb-1">{shoe.brand}</div>
                    <h3 className="font-bold text-white leading-tight mb-1">{shoe.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">${shoe.price}</span>
                        {shoe.category === 'Trail' && <span className="text-[10px] text-[#A0AEC0] border border-white/10 px-1 rounded">Trail</span>}
                    </div>
                </div>
            </div>
        ))}
      </div>
      
      {displayedInventory.length === 0 && (
          <div className="text-center py-12 text-[#A0AEC0]">
              <p>No inventory matches these specific filters.</p>
              <Button variant="ghost" className="mt-2" onClick={() => setActiveFilters({ brands: [], category: 'All' })}>Clear Filters</Button>
          </div>
      )}

      {showFilters && createPortal(FilterDrawer, document.body)}
    </div>
  );
};