import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
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
import { THEME } from './theme';

export default function App() {
  // Always start unauthenticated — every launch requires biometric/password.
  // loggedOut = true when the user explicitly logged out; in that case Auth
  // starts on the account-list screen rather than the biometric prompt.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Shoe | null>(null);
  const [shopFiltered, setShopFiltered] = useState(false);
  const [communityParams, setCommunityParams] = useState<{ type: 'trail' | 'event', id: string } | null>(null);

  // lockGeneration is incremented every time we want to (re)trigger authentication.
  // Using a counter (never null) means the useEffect in Auth always sees a new value
  // and re-fires — there is no intermediate null state that could be dropped.
  const [lockGeneration, setLockGeneration] = useState(0);

  // Track cart count for badge
  const [cartCount, setCartCount] = useState(storageService.getCart().length);

  // Returns true when there is a real (non-guest) account to lock.
  const hasRealUser = useCallback((): boolean => {
    const accountId = storageService.getCurrentAccountId();
    const profile = storageService.getProfile();
    return !!(accountId && !profile?.isGuest);
  }, []);

  // Lock storage + React auth state immediately (for visual security).
  const lockVisually = useCallback(() => {
    storageService.setAuthenticated(false);
    setIsAuthenticated(false);
  }, []);

  // Increment the generation counter to trigger a fresh biometric prompt in Auth.
  const bumpLock = useCallback(() => {
    if (hasRealUser()) {
      lockVisually();
      setLockGeneration(g => g + 1);
    }
  }, [hasRealUser, lockVisually]);

  // ── Cold-launch trigger ───────────────────────────────────────────────────
  // On a cold launch (app fully killed → reopened), appStateChange never fires.
  // We trigger the first lock here, with a short delay to give the Capacitor
  // native layer time to finish initialising before we attempt a system dialog.
  const coldLaunchFired = useRef(false);
  useEffect(() => {
    if (!coldLaunchFired.current) {
      coldLaunchFired.current = true;
      storageService.setAuthenticated(false); // always wipe persisted auth flag

      if (hasRealUser()) {
        // 400 ms lets the app fully mount and Capacitor plugins initialise
        // before we attempt to show a Face ID / Touch ID system dialog.
        const t = setTimeout(() => {
          setLockGeneration(1);
        }, 400);
        return () => clearTimeout(t);
      }
    }
  }, [hasRealUser]);

  // ── Background → Foreground listeners ────────────────────────────────────
  useEffect(() => {
    let capListener: any;

    // Native (iOS / Android): Capacitor appStateChange
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // App going to background — lock the UI immediately for visual security.
        lockVisually();
      } else {
        // App returning to foreground — trigger a fresh biometric prompt.
        bumpLock();
      }
    }).then(l => { capListener = l; });

    // Web / PWA: browser tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        lockVisually();
      } else {
        bumpLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (capListener) capListener.remove();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [bumpLock, lockVisually]);

  // ── Cart badge polling ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const count = storageService.getCart().length;
      if (count !== cartCount) setCartCount(count);
    }, 500);
    return () => clearInterval(interval);
  }, [cartCount]);

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
    setLoggedOut(true);   // show account list, not biometric prompt
    setLockGeneration(0); // suppress any pending lock trigger
  };

  const handleNavigate = (tab: string, params?: any) => {
    if (tab === 'shop') setShopFiltered(false);
    if (tab === 'community' && params) setCommunityParams(params);
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    const accountId = storageService.getCurrentAccountId();
    const profile = storageService.getProfile();
    const isRealUser = !!(accountId && !profile?.isGuest);

    // After an explicit logout pass null so Auth shows the account list;
    // otherwise pass the real accountId so it goes straight to biometric.
    const authAccountId = loggedOut ? null : (isRealUser ? accountId : null);

    return (
      <Auth
        onAuthenticated={() => { setLoggedOut(false); setIsAuthenticated(true); }}
        lockGeneration={lockGeneration}
        accountId={authAccountId}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home onNavigate={handleNavigate} />;
      case 'finder': return <Finder onComplete={() => { setShopFiltered(true); setActiveTab('shop'); }} />;
      case 'shop': return <Shop filteredMode={shopFiltered} onProductClick={setSelectedProduct} />;
      case 'cart': return <Cart onBack={() => setActiveTab('shop')} />;
      case 'community': return <Community initialItem={communityParams} onItemConsumed={() => setCommunityParams(null)} />;
      case 'profile': return <Profile onLogout={handleLogout} />;
      default: return <Home onNavigate={handleNavigate} />;
    }
  };

  const isShopActive = activeTab === 'shop';

  return (
    <>
      {/* Floating Cart Button */}
      <div
        className={`fixed bottom-32 right-5 z-40 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isShopActive
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          : 'opacity-0 translate-y-10 pointer-events-none scale-90'
          }`}
      >
        <button
          onClick={() => setActiveTab('cart')}
          className={`w-14 h-14 bg-[${THEME.accent}] rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(228,57,40,0.4)] active:scale-95 transition-transform relative group`}
        >
          <ShoppingBag size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          {cartCount > 0 && (
            <div className={`absolute -top-1 -right-1 min-w-[20px] h-5 bg-[${THEME.text}] rounded-full text-black text-[10px] font-bold flex items-center justify-center px-1 border border-black shadow-sm`}>
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