import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Home } from './views/Home';
import { Finder } from './views/Finder';
import { Shop } from './views/Shop';
import { Cart } from './views/Cart';
import { Community } from './views/Community';
import { Profile } from './views/Profile';
import { ProductDetail } from './views/ProductDetail';
import { storageService } from './services/storage';
import { Shoe } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(storageService.isAuthenticated());
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Shoe | null>(null);
  const [shopFiltered, setShopFiltered] = useState(false);
  const [communityParams, setCommunityParams] = useState<{ type: 'trail' | 'event', id: string } | null>(null);
  
  // Track cart count for badge
  const [cartCount, setCartCount] = useState(storageService.getCart().length);

  useEffect(() => {
    // Check auth on mount
    setIsAuthenticated(storageService.isAuthenticated());
    
    // Simple interval to check cart updates
    const interval = setInterval(() => {
        const count = storageService.getCart().length;
        if (count !== cartCount) setCartCount(count);
    }, 500);
    return () => clearInterval(interval);
  }, [cartCount]);

  const handleNavigate = (tab: string, params?: any) => {
    if (tab === 'shop') setShopFiltered(false);
    if (tab === 'community' && params) {
        setCommunityParams(params);
    }
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'finder':
        return <Finder onComplete={() => { setShopFiltered(true); setActiveTab('shop'); }} />;
      case 'shop':
        return <Shop filteredMode={shopFiltered} onProductClick={setSelectedProduct} />;
      case 'cart': 
        return <Cart onBack={() => setActiveTab('shop')} />;
      case 'community':
        return <Community initialItem={communityParams} />;
      case 'profile':
        return <Profile />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  const isShopActive = activeTab === 'shop';

  return (
    <>
        {/* Floating Cart Button 
            - Moved OUTSIDE Layout to prevent it from participating in page transitions (fixes "jumping")
            - Updated Badge color to #A3EBB1 (Theme Green) to match accents
        */}
        <div 
            className={`fixed bottom-32 right-5 z-40 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isShopActive 
                    ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' 
                    : 'opacity-0 translate-y-10 pointer-events-none scale-90'
            }`}
        >
           <button 
             onClick={() => setActiveTab('cart')}
             className="w-14 h-14 bg-[#4A90E2] rounded-full flex items-center justify-center text-black shadow-[0_4px_20px_rgba(74,144,226,0.4)] active:scale-95 transition-transform relative group"
           >
             <ShoppingBag size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
             
             {cartCount > 0 && (
                 <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#A3EBB1] rounded-full text-black text-[10px] font-bold flex items-center justify-center px-1 border border-black shadow-sm">
                     {cartCount}
                 </div>
             )}
           </button>
        </div>

        <Layout activeTab={activeTab} onTabChange={handleNavigate}>
            {renderContent()}
        </Layout>
        
        {selectedProduct && (
            <ProductDetail shoe={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
    </>
  );
}