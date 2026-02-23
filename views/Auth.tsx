import React, { useState } from 'react';
import { ScanFace, Lock, ChevronRight, User } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { storageService } from '../services/storage';

interface AuthProps {
  onAuthenticated: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [isSetup, setIsSetup] = useState(!!storageService.getProfile().name);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSetup = () => {
    if (name && email) {
      storageService.updateProfile({ name, email, isGuest: false });
      setIsSetup(true);
    }
  };

  const handleGuest = () => {
    storageService.updateProfile({ name: 'Guest Runner', email: '', isGuest: true });
    storageService.setAuthenticated(true);
    onAuthenticated();
  };

  const handleUnlock = () => {
    setIsScanning(true);
    // Simulate biometric scan delay
    setTimeout(() => {
      storageService.setAuthenticated(true);
      onAuthenticated();
    }, 1500);
  };

  // If user is guest, they bypass biometric lock on return
  const profile = storageService.getProfile();
  if (profile.isGuest && isSetup) {
      // Auto-login or simple button for guest
      return (
        <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, Guest</h2>
            <Button size="lg" className="w-48 mt-8" onClick={() => {
                storageService.setAuthenticated(true);
                onAuthenticated();
            }}>
                Enter Store
            </Button>
        </div>
      )
  }

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#111111] to-transparent opacity-50 -z-10" />
        
        <div className="w-full max-w-sm">
          <h1 className="text-4xl font-bold text-white mb-2">Second Sole<br/><span className="gradient-text">Medina</span></h1>
          <p className="text-[#A0AEC0] mb-8">Precision fit. Local expertise. Digital speed.</p>
          
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Initial Setup</h2>
            <div className="space-y-4">
              <Input 
                placeholder="First Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <Input 
                placeholder="Email Address" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </Card>

          <Button fullWidth onClick={handleSetup} disabled={!name || !email} className="mb-4">
            Initialize Profile <ChevronRight size={18} className="ml-2" />
          </Button>

          <Button fullWidth variant="ghost" onClick={handleGuest}>
            Continue as Guest
          </Button>

          <p className="text-xs text-center text-[#A0AEC0]/50 mt-8">
            All data stored locally on device. No cloud transmission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-12 relative">
        <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${isScanning ? 'border-[#e43928] shadow-[0_0_50px_rgba(228,57,40,0.5)]' : 'border-[#111111]'}`}>
           <ScanFace size={48} className={isScanning ? 'text-[#e43928] animate-pulse' : 'text-white'} />
        </div>
        {isScanning && (
            <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin" />
        )}
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, {profile.name}</h2>
      <p className="text-[#A0AEC0] mb-12">System Locked. FaceID Required.</p>

      <Button size="lg" className="w-48" onClick={handleUnlock}>
        {isScanning ? 'Verifying...' : 'Unlock'}
      </Button>
      
      <div className="flex items-center gap-2 mt-8 text-xs text-[#A0AEC0]">
        <Lock size={12} />
        <span>Local Encrypted Vault</span>
      </div>
    </div>
  );
};