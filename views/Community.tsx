import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Users, X, Calendar, UserCheck, ChevronRight, Navigation, Info } from 'lucide-react';
import { Badge, Button } from '../components/UI';
import { TRAILS, EVENTS } from '../constants';
import { Trail, Event } from '../types';
import { storageService } from '../services/storage';
import { THEME } from '../theme';

interface CommunityProps {
    initialItem?: { type: 'trail' | 'event', id: string } | null;
    onItemConsumed?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
    Open: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Muddy: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    Closed: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export const Community: React.FC<CommunityProps> = ({ initialItem, onItemConsumed }) => {
    const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [section, setSection] = useState<'terrain' | 'runs'>('terrain');
    // Initialize from persisted storage so switching tabs doesn't reset state
    const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(
        () => new Set(storageService.getRsvpedEvents())
    );

    useEffect(() => {
        if (initialItem) {
            if (initialItem.type === 'trail') {
                const trail = TRAILS.find(t => t.id === initialItem.id);
                if (trail) setSelectedTrail(trail);
            } else if (initialItem.type === 'event') {
                const event = EVENTS.find(e => e.id === initialItem.id);
                if (event) setSelectedEvent(event);
            }
            // Clear from parent so tab re-visits don't re-open the modal
            onItemConsumed?.();
        }
    }, [initialItem]);

    const handleCancelRsvp = (eventId: string) => {
        storageService.removeRsvp(eventId);
        setRsvpedEvents(prev => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
        });
    };

    const handleRsvp = (eventId: string) => {
        storageService.rsvpEvent(eventId);
        setRsvpedEvents(prev => new Set([...prev, eventId]));
    };

    const handleTrailDirections = (trail: Trail) => {
        const query = encodeURIComponent(`${trail.name} Medina, OH`);
        window.location.href = `maps://?daddr=${query}`;
    };


    // ── Trail Detail Sheet ──────────────────────────────────────────────────
    const TrailModal = selectedTrail ? (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTrail(null)} />
            <div className={`bg-[${THEME.surface}] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col`}
                style={{ maxHeight: '85vh' }}>

                {/* Hero photo */}
                <div className="relative h-52 flex-shrink-0 bg-black">
                    {selectedTrail.photo ? (
                        <img
                            src={selectedTrail.photo}
                            alt={selectedTrail.name}
                            className="w-full h-full object-cover opacity-80"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <MapPin size={64} className={`text-[${THEME.muted}]`} />
                        </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Close button */}
                    <button
                        onClick={() => setSelectedTrail(null)}
                        className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Status + distance badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[selectedTrail.status]}`}>
                            {selectedTrail.status}
                        </span>
                    </div>

                    {/* Title at bottom of photo */}
                    <div className="absolute bottom-4 left-5 right-16">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedTrail.name}</h2>
                        <p className={`text-sm text-white/70 mt-0.5`}>{selectedTrail.surface} · {selectedTrail.distance}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                    <p className="text-white/80 leading-relaxed">{selectedTrail.description}</p>

                    {/* Highlights */}
                    <div>
                        <h4 className={`text-xs font-bold text-[${THEME.muted}] uppercase tracking-wider mb-3`}>Highlights</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {selectedTrail.highlights.map((h, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                                    <div className={`w-1.5 h-1.5 rounded-full bg-[${THEME.accent}] flex-shrink-0`} />
                                    <span className="text-sm text-white">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Parking */}
                    <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                        <Navigation size={16} className={`text-[${THEME.muted}] mt-0.5 flex-shrink-0`} />
                        <div>
                            <p className={`text-xs font-bold text-[${THEME.muted}] uppercase mb-1`}>Parking</p>
                            <p className="text-sm text-white">{selectedTrail.parkingInfo}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex-shrink-0">
                    <Button fullWidth onClick={() => handleTrailDirections(selectedTrail)}>
                        <Navigation size={16} className="mr-2" />
                        Get Directions
                    </Button>
                </div>
            </div>
        </div>
    ) : null;

    // ── Event Detail Sheet ──────────────────────────────────────────────────
    const EventModal = selectedEvent ? (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
            <div className={`bg-[${THEME.surface}] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300`}>
                {/* Accent top bar */}
                <div className={`h-1 w-full bg-gradient-to-r from-[${THEME.text}] to-[${THEME.accent}]`} />

                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <p className={`text-xs font-bold text-[${THEME.accent}] uppercase tracking-wider mb-1`}>Group Run</p>
                            <h2 className="text-2xl font-bold text-white">{selectedEvent.name}</h2>
                            <div className={`flex items-center gap-2 text-[${THEME.muted}] text-sm mt-1`}>
                                <Calendar size={13} />
                                <span>{selectedEvent.day} · {selectedEvent.time}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <p className="text-white/80 mb-5 leading-relaxed">{selectedEvent.description}</p>

                    {/* Pace groups */}
                    <div className="mb-6">
                        <h4 className={`text-xs font-bold text-[${THEME.muted}] uppercase tracking-wider mb-3`}>Pace Groups</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedEvent.paceGroups.map(pace => (
                                <span key={pace} className="text-xs font-semibold bg-white/5 text-white border border-white/10 px-3 py-1.5 rounded-full">
                                    {pace}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* RSVP — persistent, cancellable */}
                    {rsvpedEvents.has(selectedEvent.id) ? (
                        <div className="space-y-2">
                            <div className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 font-bold`}>
                                <UserCheck size={18} />
                                You're Going!
                            </div>
                            <button
                                onClick={() => handleCancelRsvp(selectedEvent.id)}
                                className={`w-full text-center text-xs text-[${THEME.muted}] hover:text-white transition-colors py-1`}
                            >
                                Cancel RSVP
                            </button>
                        </div>
                    ) : (
                        <Button fullWidth onClick={() => handleRsvp(selectedEvent.id)}>
                            I'm Going — RSVP
                        </Button>
                    )}
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <div className="space-y-4 pb-8">

                {/* ── Segment Control ───────────────────────────────────── */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSection('terrain')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${section === 'terrain'
                            ? `bg-gradient-to-r from-[${THEME.text}] to-[${THEME.accent}] text-black`
                            : `bg-[${THEME.surface}] text-[${THEME.muted}]`}`}
                    >
                        Local Terrain
                    </button>
                    <button
                        onClick={() => setSection('runs')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${section === 'runs'
                            ? `bg-gradient-to-r from-[${THEME.text}] to-[${THEME.accent}] text-black`
                            : `bg-[${THEME.surface}] text-[${THEME.muted}]`}`}
                    >
                        Run Groups
                    </button>
                </div>

                {/* ── Local Terrain ─────────────────────────────────────── */}
                {section === 'terrain' && <div>
                    <div className="mb-2">
                        <h2 className="text-2xl font-bold text-white">Local Terrain</h2>
                        <p className={`text-sm text-[${THEME.muted}] mt-0.5`}>Curated routes by Medina staff</p>
                    </div>
                    <div className="space-y-4">
                        {TRAILS.map(trail => (
                            <div
                                key={trail.id}
                                className="group relative rounded-[24px] overflow-hidden cursor-pointer border border-white/10 active:scale-[0.98] transition-transform"
                                onClick={() => setSelectedTrail(trail)}
                            >
                                {/* Photo background */}
                                <div className="h-44 relative bg-black">
                                    {trail.photo ? (
                                        <img
                                            src={trail.photo}
                                            alt={trail.name}
                                            className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                            <MapPin size={40} className={`text-[${THEME.muted}]`} />
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                    {/* Status badge — top left */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[trail.status]}`}>
                                            {trail.status}
                                        </span>
                                    </div>

                                    {/* Tap hint — top right */}
                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                                        <ChevronRight size={14} className="text-white/70" />
                                    </div>

                                    {/* Text info — bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-lg font-bold text-white leading-tight">{trail.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs text-white/60`}>{trail.surface}</span>
                                            <span className="text-white/30">·</span>
                                            <span className={`text-xs font-semibold text-[${THEME.accent}]`}>{trail.distance}</span>
                                        </div>
                                        <p className="text-xs text-white/60 mt-1 line-clamp-1">{trail.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>}

                {/* ── Run Groups ─────────────────────────────────────────── */}
                {section === 'runs' && <div>
                    <div className="mb-2">
                        <h2 className="text-2xl font-bold text-white">Run Groups</h2>
                        <p className={`text-sm text-[${THEME.muted}] mt-0.5`}>All paces welcome — free to join</p>
                    </div>
                    <div className="space-y-3">
                        {EVENTS.map(event => (
                            <div
                                key={event.id}
                                className={`bg-[${THEME.surface}] border border-white/10 rounded-[20px] p-5 cursor-pointer active:scale-[0.98] transition-transform group`}
                                onClick={() => setSelectedEvent(event)}
                            >
                                {/* Red left accent */}
                                <div className="flex gap-4 items-start">
                                    <div className={`w-1 self-stretch rounded-full bg-gradient-to-b from-[${THEME.text}] to-[${THEME.accent}] flex-shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-white text-lg leading-tight">{event.name}</h3>
                                                <div className={`flex items-center gap-1.5 text-[${THEME.muted}] text-xs mt-1`}>
                                                    <Calendar size={11} />
                                                    <span>{event.day} · {event.time}</span>
                                                </div>
                                            </div>
                                            {rsvpedEvents.has(event.id) ? (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/15 border border-green-500/30 px-2.5 py-1 rounded-full flex-shrink-0">
                                                    <UserCheck size={11} />
                                                    Going
                                                </span>
                                            ) : (
                                                <ChevronRight size={16} className={`text-[${THEME.muted}] group-hover:text-white transition-colors flex-shrink-0 mt-0.5`} />
                                            )}
                                        </div>

                                        <p className={`text-sm text-[${THEME.muted}] mt-2 leading-relaxed`}>{event.description}</p>

                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {event.paceGroups.slice(0, 3).map(pace => (
                                                <span key={pace} className="text-[10px] font-semibold bg-white/5 text-white/60 border border-white/10 px-2 py-0.5 rounded-full">
                                                    {pace}
                                                </span>
                                            ))}
                                            {event.paceGroups.length > 3 && (
                                                <span className="text-[10px] font-semibold bg-white/5 text-white/60 border border-white/10 px-2 py-0.5 rounded-full">
                                                    +{event.paceGroups.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>}
            </div>

            {selectedTrail && createPortal(TrailModal, document.body)}
            {selectedEvent && createPortal(EventModal, document.body)}
        </>
    );
};