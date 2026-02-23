import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Info, User } from 'lucide-react';
import { Button, Badge } from '../components/UI';
import { Shoe } from '../types';
import { storageService } from '../services/storage';

interface ProductDetailProps {
  shoe: Shoe;
  onClose: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ shoe, onClose }) => {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];

  const handleAddToCart = () => {
    if (selectedSize) {
        storageService.addToCart({ shoeId: shoe.id, size: selectedSize, quantity: 1 });
        onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-[#111111] w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[32px] rounded-t-[32px] relative z-10 flex flex-col overflow-hidden border border-white/10 animate-in slide-in-from-bottom duration-300">
        <div className="h-64 relative bg-[#000] flex-shrink-0">
             <img src={shoe.image} alt={shoe.name} referrerPolicy="no-referrer" className="w-full h-full object-contain p-4 opacity-90" />
             <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-md z-10 hover:bg-black/70">
                 <X size={20} />
             </button>
             <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#111111] to-transparent" />
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-[#A0AEC0] text-sm font-medium mb-1">{shoe.brand}</div>
                    <h2 className="text-2xl font-bold text-white">{shoe.name}</h2>
                </div>
                <div className="text-xl font-bold text-[#e43928]">${shoe.price}</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <Badge color="bg-white/10 text-white border border-white/10">{shoe.category}</Badge>
                <Badge color="bg-white/10 text-white border border-white/10">{shoe.support}</Badge>
                <Badge color="bg-white/10 text-white border border-white/10">{shoe.cushion}</Badge>
            </div>

            <p className="text-[#A0AEC0] leading-relaxed mb-6">{shoe.description}</p>
            
            {shoe.staffComparison && (
                <div className="bg-[#e43928]/10 border-l-2 border-[#e43928] p-4 rounded-r-xl mb-6">
                    <div className="flex items-center gap-2 text-[#e43928] font-bold text-xs uppercase mb-1">
                        <User size={12} /> Staff Take
                    </div>
                    <p className="text-sm italic text-white/90">"{shoe.staffComparison}"</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 p-3 rounded-xl">
                    <div className="text-xs text-[#A0AEC0] mb-1">Drop</div>
                    <div className="font-bold">{shoe.drop}mm</div>
                </div>
                <div className="bg-black/40 p-3 rounded-xl">
                    <div className="text-xs text-[#A0AEC0] mb-1">Weight</div>
                    <div className="font-bold">{shoe.weight}oz</div>
                </div>
            </div>

            <div className="mb-8">
                <div className="text-sm font-bold mb-3">Select Size (US)</div>
                <div className="grid grid-cols-4 gap-2">
                    {SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`h-10 rounded-lg text-sm font-medium transition-all ${selectedSize === size ? 'bg-[#e43928] text-white shadow-[0_0_15px_rgba(228,57,40,0.4)]' : 'bg-black/40 text-white hover:bg-white/10'}`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#111111] safe-area-bottom">
            <Button fullWidth size="lg" disabled={!selectedSize} onClick={handleAddToCart}>
                Add to Bag
                <ShoppingBag size={18} className="ml-2" />
            </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};