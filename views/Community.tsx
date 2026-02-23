import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Map, Users, Info, X, Calendar, UserCheck } from 'lucide-react';
import { Card, SectionHeader, Badge, Button } from '../components/UI';
import { TRAILS, EVENTS } from '../constants';
import { Trail, Event } from '../types';
import { storageService } from '../services/storage';

interface CommunityProps {
    initialItem?: { type: 'trail' | 'event', id: string } | null;
}

export const Community: React.FC<CommunityProps> = ({ initialItem }) => {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  useEffect(() => {
    if (initialItem) {
        if (initialItem.type === 'trail') {
            const trail = TRAILS.find(t => t.id === initialItem.id);
            if (trail) setSelectedTrail(trail);
        } else if (initialItem.type === 'event') {
            const event = EVENTS.find(e => e.id === initialItem.id);
            if (event) setSelectedEvent(event);
        }
    }
  }, [initialItem]);

  const handleRsvp = () => {
      storageService.rsvpEvent();
      setRsvpSuccess(true);
      setTimeout(() => setRsvpSuccess(false), 2000);
  };

  const handleTrailDirections = () => {
    if (selectedTrail) {
        // Uses maps:// scheme to open native maps app directly with the trail location
        const query = encodeURIComponent(`${selectedTrail.name} Medina, OH`);
        window.location.href = `maps://?daddr=${query}`;
    }
  };

  const TrailModal = selectedTrail ? (
      <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTrail(null)} />
          <div className="bg-[#111111] w-full max-w-md h-[80vh] rounded-t-[32px] sm:rounded-[32px] flex flex-col relative z-10 border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="h-40 bg-white/5 flex items-center justify-center relative flex-shrink-0">
                   <Map size={64} className="text-[#A0AEC0]" />
                   <button onClick={() => setSelectedTrail(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/70 transition-colors">
                       <X size={20} />
                   </button>
                   <div className="absolute bottom-4 left-4">
                       <h2 className="text-2xl font-bold text-white shadow-black drop-shadow-md">{selectedTrail.name}</h2>
                   </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="flex gap-2 mb-6">
                      <Badge color={selectedTrail.status === 'Open' ? 'bg-green-500/20 text-green-500' : selectedTrail.status === 'Muddy' ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}>{selectedTrail.status}</Badge>
                      <Badge color="bg-[#e43928]/20 text-[#e43928]">{selectedTrail.distance}</Badge>
                  </div>

                  <div className="space-y-6">
                      <div>
                          <h4 className="text-sm text-[#A0AEC0] uppercase font-bold mb-2">Highlights</h4>
                          <ul className="space-y-2">
                              {selectedTrail.highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-white">
                                      <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5" />
                                      {h}
                                  </li>
                              ))}
                          </ul>
                      </div>
                      <div>
                          <h4 className="text-sm text-[#A0AEC0] uppercase font-bold mb-2">Parking</h4>
                          <p className="text-sm text-white">{selectedTrail.parkingInfo}</p>
                      </div>
                  </div>
              </div>
              <div className="p-4 border-t border-white/5 flex-shrink-0 safe-area-bottom">
                  <Button fullWidth variant="secondary" onClick={handleTrailDirections}>
                      Get Directions
                  </Button>
              </div>
          </div>
      </div>
  ) : null;

  const EventModal = selectedEvent ? (
      <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="bg-[#111111] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                       <div>
                           <h2 className="text-2xl font-bold text-white">{selectedEvent.name}</h2>
                           <div className="flex items-center gap-2 text-[#A0AEC0] text-sm mt-1">
                               <Calendar size={14} />
                               <span>{selectedEvent.day} at {selectedEvent.time}</span>
                           </div>
                       </div>
                       <button onClick={() => setSelectedEvent(null)} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                           <X size={20} />
                       </button>
                  </div>

                  <p className="text-white/80 mb-6">{selectedEvent.description}</p>

                  <div className="mb-6">
                       <h4 className="text-sm text-[#A0AEC0] uppercase font-bold mb-3">Pace Groups</h4>
                       <div className="flex flex-wrap gap-2">
                           {selectedEvent.paceGroups.map(pace => (
                               <Badge key={pace} color="bg-white/5 text-white border border-white/10">{pace}</Badge>
                           ))}
                       </div>
                  </div>

                  <Button fullWidth onClick={handleRsvp} disabled={rsvpSuccess}>
                      {rsvpSuccess ? <><UserCheck size={18} className="mr-2" /> You're Going!</> : "I'm Going (RSVP)"}
                  </Button>
              </div>
          </div>
      </div>
  ) : null;

  return (
    <>
    <div className="space-y-8 pb-8">
      <div>
        <SectionHeader title="Local Terrain" subtitle="Curated routes by Medina staff" />
        <div className="space-y-4">
            {TRAILS.map(trail => (
                <Card 
                    key={trail.id} 
                    className="relative overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedTrail(trail)}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Map size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold">{trail.name}</h3>
                            <div className="flex gap-2">
                                <Badge color={trail.status === 'Open' ? 'bg-green-500/20 text-green-500' : trail.status === 'Muddy' ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}>{trail.status}</Badge>
                                <Badge color="bg-[#111111] text-white border border-white/10">{trail.distance}</Badge>
                            </div>
                        </div>
                        <div className="text-sm text-[#A0AEC0] mb-3">{trail.surface}</div>
                        <p className="text-sm leading-relaxed text-white/80">{trail.description}</p>
                    </div>
                </Card>
            ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Run Groups" />
        <div className="space-y-4">
            {EVENTS.map(event => (
                 <Card 
                    key={event.id} 
                    className="bg-gradient-to-r from-[#111111] to-[#1a1a1a] border-l-4 border-[#e43928] cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                 >
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-[#e43928]" />
                        <h3 className="font-bold">{event.name}</h3>
                    </div>
                    <p className="text-sm text-[#A0AEC0] mb-4">
                        {event.description}
                    </p>
                    <div className="text-sm">
                        <span className="block text-white font-bold">{event.day} @ {event.time}</span>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>

    {selectedTrail && createPortal(TrailModal, document.body)}
    {selectedEvent && createPortal(EventModal, document.body)}
    </>
  );
};