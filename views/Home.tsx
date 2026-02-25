import React from 'react';
import { MapPin, Clock, Footprints, Tag } from 'lucide-react';
import { Card, Button, SectionHeader, Badge } from '../components/UI';
import { storageService } from '../services/storage';
import { EVENTS } from '../constants';
import { THEME } from '../theme';

interface HomeProps {
  onNavigate: (tab: string, params?: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const profile = storageService.getProfile();
  const rotation = storageService.getRotation();
  const currentHour = new Date().getHours();
  const isOpen = currentHour >= 10 && currentHour < 19;

  const totalMiles = rotation.reduce((sum, shoe) => sum + shoe.miles, 0);

  const handleCall = () => {
    window.location.href = 'tel:3307255918';
  };

  const handleDirections = () => {
    window.location.href = 'maps://?daddr=122+Public+Square,+Medina,+OH+44256';
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className={`text-[${THEME.muted}] text-sm mb-1`}>Good {currentHour < 12 ? 'Morning' : currentHour < 18 ? 'Afternoon' : 'Evening'}</p>
          <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
        </div>
        {!profile.isGuest && (
          <div className="text-right">
            <div className={`text-xs text-[${THEME.muted}] uppercase tracking-wider mb-1`}>Total Miles</div>
            <div className={`text-[${THEME.accent}] font-mono font-bold text-xl`}>{totalMiles} mi</div>
          </div>
        )}
      </div>

      {/* Store Status Card */}
      <Card className="relative overflow-hidden">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold">Second Sole Medina</h3>
            <span className={`flex h-3 w-3 rounded-full ${isOpen ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></span>
          </div>
          <div className={`flex items-center text-[${THEME.muted}] text-sm gap-2`}>
            <MapPin size={14} />
            <span>122 Public Square, Medina, OH</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center gap-2 text-sm text-[${THEME.muted}]`}>
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
          className={`bg-gradient-to-br from-[${THEME.surface}] to-[${THEME.surfaceAlt}] p-5 rounded-[24px] border border-white/5 cursor-pointer hover:border-[${THEME.accent}]/50 transition-colors group`}
        >
          <Footprints className={`text-[${THEME.accent}] mb-3 group-hover:scale-110 transition-transform`} />
          <h3 className="font-bold text-lg leading-tight mb-1">Shoe Finder</h3>
          <p className={`text-xs text-[${THEME.muted}]`}>Find Your Perfect Pair</p>
        </div>
        <div
          onClick={() => onNavigate('shop')}
          className={`bg-gradient-to-br from-[${THEME.surface}] to-[${THEME.surfaceAlt}] p-5 rounded-[24px] border border-white/5 cursor-pointer hover:border-white/50 transition-colors group`}
        >
          <Tag className="text-white mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg leading-tight mb-1">Shop Now</h3>
          <p className={`text-xs text-[${THEME.muted}]`}>Browse Current Deals</p>
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
                <span className={`text-[10px] uppercase text-[${THEME.muted}]`}>{event.day.split(' ')[0]}</span>
                <span className="font-bold text-white text-lg">{event.time.split(' ')[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white">{event.name}</h4>
                  {event.name === 'Sole Train' && <Badge color={`bg-[${THEME.accent}]`}>Popular</Badge>}
                </div>
                <p className={`text-xs text-[${THEME.muted}] leading-relaxed line-clamp-2`}>{event.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};