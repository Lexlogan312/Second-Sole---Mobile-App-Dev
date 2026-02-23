import React from 'react';
import { Home, Search, ShoppingBag, Map, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'finder', icon: Search, label: 'Finder' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'community', icon: Map, label: 'Trails' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="phone-frame">
        <div className="h-full bg-[#000000] text-white flex flex-col relative overflow-hidden">
          {/* Background Ambience */}
          <div className="fixed top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#e43928] rounded-full blur-[120px] opacity-10 pointer-events-none" />
          <div className="fixed bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#ffffff] rounded-full blur-[120px] opacity-10 pointer-events-none" />

          {/* Main Content Area */}
          <main className="flex-1 w-full relative z-10 pb-36 px-5 h-full overflow-y-auto custom-scrollbar" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Navigation */}
          <nav className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="glass-panel rounded-[32px] h-20 flex items-center justify-around px-2 shadow-2xl shadow-black/50">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className="relative flex flex-col items-center justify-center w-14 h-14"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-[#111111] border border-white/10 rounded-2xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon 
                      size={24} 
                      className={isActive ? "text-[#e43928]" : "text-[#A0AEC0]"} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-white" : "text-[#A0AEC0]"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};