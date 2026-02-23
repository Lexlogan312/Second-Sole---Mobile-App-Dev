import React from 'react';
import { MapPin, Clock, Zap, Map } from 'lucide-react';
import { Card, Button, SectionHeader, Badge } from '../components/UI';
import { storageService } from '../services/storage';
import { EVENTS } from '../constants';

interface HomeProps {
  onNavigate: (tab: string, params?: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const profile = storageService.getProfile();
  const rotation = storageService.getRotation();
  const currentHour = new Date().getHours();
  const isOpen = currentHour >= 10 && currentHour < 19;

  // Calculate total miles from rotation
  const totalMiles = rotation.reduce((sum, shoe) => sum + shoe.miles, 0);

  const handleCall = () => {
    // window.location.href prevents a blank tab from opening before the call prompt
    window.location.href = 'tel:3307255918';
  };

  const handleDirections = () => {
    // The 'maps://' scheme specifically instructs iOS to open the Maps app directly,
    // skipping the browser step entirely.
    window.location.href = 'maps://?daddr=122+Public+Square,+Medina,+OH+44256';
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[#A0AEC0] text-sm mb-1">Good {currentHour < 12 ? 'Morning' : currentHour < 18 ? 'Afternoon' : 'Evening'}</p>
          <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
        </div>
        {!profile.isGuest && (
            <div className="text-right">
            <div className="text-xs text-[#A0AEC0] uppercase tracking-wider mb-1">Total Miles</div>
            <div className="text-[#e43928] font-mono font-bold text-xl">{totalMiles} mi</div>
            </div>
        )}
      </div>

      {/* Store Status Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
            <span className={`flex h-3 w-3 rounded-full ${isOpen ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></span>
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1">Second Sole Medina</h3>
          <div className="flex items-center text-[#A0AEC0] text-sm gap-2">
            <MapPin size={14} />
            <span>122 Public Square, Medina, OH</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-[#A0AEC0]">
            <Clock size={14} />
            <span className={isOpen ? 'text-white' : 'text-red-400'}>
              {isOpen ? 'Open until 7:00pm' : 'Closed • Opens 10am'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" onClick={handleCall}>Call Store</Button>
            <Button variant="secondary" size="sm" onClick={handleDirections}>Directions</Button>
        </div>
      </Card>

      {/* CTA Area */}
      <div className="grid grid-cols-2 gap-4">
        <div 
            onClick={() => onNavigate('finder')}
            className="bg-gradient-to-br from-[#111111] to-[#1a1a1a] p-5 rounded-[24px] border border-white/5 cursor-pointer hover:border-[#e43928]/50 transition-colors group"
        >
            <Zap className="text-[#e43928] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg leading-tight mb-1">Gait<br/>Analysis</h3>
            <p className="text-xs text-[#A0AEC0]">AI-Powered Quiz</p>
        </div>
        <div 
            onClick={() => onNavigate('shop')}
            className="bg-gradient-to-br from-[#111111] to-[#1a1a1a] p-5 rounded-[24px] border border-white/5 cursor-pointer hover:border-white/50 transition-colors group"
        >
            <div className="text-white mb-3 group-hover:scale-110 transition-transform font-bold text-xl">%</div>
            <h3 className="font-bold text-lg leading-tight mb-1">Current<br/>Stock</h3>
            <p className="text-xs text-[#A0AEC0]">View Inventory</p>
        </div>
      </div>

      {/* Community Feed */}
      <div>
        <SectionHeader title="Run Hub" subtitle="Upcoming runs & events" />
        <div className="space-y-4">
            {EVENTS.map(event => (
                <Card 
                  key={event.id} 
                  className="p-5 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => onNavigate('community', { type: 'event', id: event.id })}
                >
                    <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[60px]">
                        <span className="text-[10px] uppercase text-[#A0AEC0]">{event.day.split(' ')[0]}</span>
                        <span className="font-bold text-white text-lg">{event.time.split(' ')[0]}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-white">{event.name}</h4>
                             {event.name === 'Sole Train' && <Badge color="bg-[#e43928]">Popular</Badge>}
                        </div>
                        <p className="text-xs text-[#A0AEC0] leading-relaxed line-clamp-2">{event.description}</p>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
};