import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Trash2, Shield, Plus, Activity, AlertCircle, X, Check, Calendar, LogOut } from 'lucide-react';
import { Card, Button, SectionHeader, Input, Badge } from '../components/UI';
import { storageService } from '../services/storage';
import { ShoeRotationItem } from '../types';
import { INVENTORY } from '../constants';
import { THEME } from '../theme';

export const Profile: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [profile, setProfile] = useState(storageService.getProfile());
    const [rotation, setRotation] = useState(storageService.getRotation());
    const [privacyAudit] = useState(storageService.getPrivacyAudit());

    const [showLogModal, setShowLogModal] = useState<string | null>(null);
    const [logMilesInput, setLogMilesInput] = useState('');
    const [logTerrain, setLogTerrain] = useState<'Road' | 'Trail'>('Road');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

    const [addingShoe, setAddingShoe] = useState(false);
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
    const [customName, setCustomName] = useState('');

    if (profile.isGuest) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Shield size={48} className={`text-[${THEME.muted}] mb-4`} />
                <h2 className="text-xl font-bold mb-2">Guest Mode</h2>
                <p className={`text-[${THEME.muted}] mb-6`}>Create a secure local profile to unlock the Sole Tracker, multi-shoe rotation, and discount rewards.</p>
                <Button onClick={() => storageService.wipeData()} className="mb-3">Create Profile</Button>
                <button
                    onClick={onLogout}
                    className={`flex items-center gap-2 text-sm text-[${THEME.muted}] hover:text-white transition-colors`}
                >
                    <LogOut size={14} /> Sign Out
                </button>
            </div>
        );
    }

    const handleLogMiles = () => {
        if (showLogModal && logMilesInput) {
            const miles = parseFloat(logMilesInput);
            if (isNaN(miles) || miles <= 0) return;

            storageService.updateRotationShoe(showLogModal, miles);
            storageService.updateProfile({ milesRun: (profile.milesRun || 0) + miles });

            setRotation(storageService.getRotation());
            setProfile(storageService.getProfile());
            setShowLogModal(null);
            setLogMilesInput('');
            setLogTerrain('Road');
        }
    };

    const handleAddShoe = () => {
        let shoeName = customName;
        let shoeImg = undefined;
        let shoeIdRef = 'custom';

        if (selectedInventoryId) {
            const invShoe = INVENTORY.find(s => s.id === selectedInventoryId);
            if (invShoe) {
                shoeName = invShoe.name;
                shoeImg = invShoe.image;
                shoeIdRef = invShoe.id;
            }
        }

        if (shoeName) {
            const newShoe: ShoeRotationItem = {
                id: Date.now().toString(),
                shoeId: shoeIdRef,
                name: shoeName,
                miles: 0,
                threshold: 350,
                image: shoeImg
            };
            storageService.addToRotation(newShoe);
            setRotation(storageService.getRotation());
            setAddingShoe(false);
            setCustomName('');
            setSelectedInventoryId('');
            setShoeSearch('');
            setBrandFilter('All');
        }

    };

    const handleDeleteShoe = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Retire this shoe?')) {
            storageService.removeRotationShoe(id);
            setRotation(storageService.getRotation());
        }
    };

    // ── Add Shoe Modal state ──────────────────────────────────────────────
    const [shoeSearch, setShoeSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('All');

    const ALL_BRANDS_ROT = ['All', ...new Set(INVENTORY.map(s => s.brand))].sort();
    const filteredShoes = INVENTORY.filter(s => {
        const matchesBrand = brandFilter === 'All' || s.brand === brandFilter;
        const q = shoeSearch.toLowerCase();
        const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q);
        return matchesBrand && matchesSearch;
    });

    const AddShoeModal = (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setAddingShoe(false); setShoeSearch(''); setBrandFilter('All'); }} />
            <div className={`bg-[${THEME.surface}] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 animate-in slide-in-from-bottom duration-300 flex flex-col`}
                style={{ height: '88vh' }}>

                {/* Header */}
                <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-xl text-white">Add to Rotation</h3>
                        <p className={`text-xs text-[${THEME.muted}] mt-0.5`}>{filteredShoes.length} shoes available</p>
                    </div>
                    <button
                        onClick={() => { setAddingShoe(false); setShoeSearch(''); setBrandFilter('All'); }}
                        className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Search bar */}
                <div className="px-5 pb-3 flex-shrink-0">
                    <div className={`flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-4 h-11 focus-within:border-[${THEME.accent}] transition-colors`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[${THEME.muted}] flex-shrink-0`}>
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or brand..."
                            value={shoeSearch}
                            onChange={e => setShoeSearch(e.target.value)}
                            className={`bg-transparent text-white placeholder:text-[${THEME.muted}] text-sm w-full focus:outline-none`}
                            autoFocus
                        />
                        {shoeSearch && (
                            <button onClick={() => setShoeSearch('')} className={`text-[${THEME.muted}]`}><X size={14} /></button>
                        )}
                    </div>
                </div>

                {/* Brand filter pills */}
                <div className="px-5 pb-3 flex-shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {ALL_BRANDS_ROT.map(brand => (
                            <button
                                key={brand}
                                onClick={() => setBrandFilter(brand)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${brandFilter === brand
                                    ? `bg-[${THEME.accent}] text-white`
                                    : `bg-white/5 text-white/50 border border-white/10`
                                    }`}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shoe grid */}
                <div className="flex-1 overflow-y-auto px-5 pb-3 custom-scrollbar">
                    {filteredShoes.length === 0 ? (
                        <div className={`text-center py-12 text-[${THEME.muted}]`}>
                            <p className="text-sm">No shoes match "{shoeSearch}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredShoes.map(shoe => {
                                const isSelected = selectedInventoryId === shoe.id;
                                return (
                                    <button
                                        key={shoe.id}
                                        onClick={() => { setSelectedInventoryId(shoe.id); setCustomName(''); }}
                                        className={`relative text-left rounded-2xl border transition-all duration-150 overflow-hidden ${isSelected
                                            ? `border-[${THEME.accent}] ring-1 ring-[${THEME.accent}]`
                                            : 'border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {/* Image */}
                                        <div className="aspect-square bg-black relative">
                                            <img
                                                src={shoe.image}
                                                alt={shoe.name}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover object-center scale-105"
                                            />
                                            {isSelected && (
                                                <div className={`absolute top-2 right-2 bg-[${THEME.accent}] rounded-full p-1`}>
                                                    <Check size={11} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className={`p-2.5 bg-[${THEME.surface}]`}>
                                            <p className={`text-[10px] text-[${THEME.muted}] font-medium`}>{shoe.brand}</p>
                                            <p className="text-xs font-bold text-white leading-tight line-clamp-2 mt-0.5">{shoe.name}</p>
                                            <p className={`text-[10px] text-[${THEME.muted}] mt-1`}>{shoe.gender}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Custom entry divider */}
                    <div className="my-4 flex items-center gap-3">
                        <div className="flex-1 border-t border-white/10" />
                        <span className={`text-xs text-[${THEME.muted}]`}>or enter manually</span>
                        <div className="flex-1 border-t border-white/10" />
                    </div>

                    <div className={`flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl px-4 h-12 focus-within:border-[${THEME.accent}]/50 transition-colors`}>
                        <input
                            placeholder="Custom shoe name..."
                            value={customName}
                            onChange={e => { setCustomName(e.target.value); setSelectedInventoryId(''); }}
                            className={`bg-transparent text-white placeholder:text-[${THEME.muted}] text-sm w-full focus:outline-none`}
                        />
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="p-5 pt-3 border-t border-white/5 flex-shrink-0">
                    <Button
                        fullWidth
                        onClick={handleAddShoe}
                        disabled={!selectedInventoryId && !customName}
                    >
                        {selectedInventoryId
                            ? `Add ${INVENTORY.find(s => s.id === selectedInventoryId)?.name ?? 'Shoe'}`
                            : customName
                                ? `Add "${customName}"`
                                : 'Select a shoe above'}
                    </Button>
                </div>
            </div>
        </div>
    );


    const LogMilesModal = (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogModal(null)} />
            <div className={`bg-[${THEME.surface}] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 p-6 animate-in slide-in-from-bottom duration-300`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Log Activity</h3>
                    <button onClick={() => setShowLogModal(null)}><X size={20} className={`text-[${THEME.muted}]`} /></button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-center py-4 bg-black/30 rounded-2xl">
                        <input
                            type="number"
                            value={logMilesInput}
                            onChange={(e) => setLogMilesInput(e.target.value)}
                            placeholder="0.0"
                            className="bg-transparent text-5xl font-bold text-center w-full focus:outline-none text-[#A3EBB1] placeholder:text-white/10"
                            autoFocus
                        />
                    </div>
                    <p className={`text-center text-[${THEME.muted}] -mt-4 text-sm font-medium`}>Miles</p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setLogTerrain('Road')}
                            className={`h-12 rounded-xl font-medium transition-colors ${logTerrain === 'Road' ? 'bg-white text-black' : `bg-black border border-white/10 text-[${THEME.muted}]`}`}
                        >
                            Road
                        </button>
                        <button
                            onClick={() => setLogTerrain('Trail')}
                            className={`h-12 rounded-xl font-medium transition-colors ${logTerrain === 'Trail' ? 'bg-[#A3EBB1] text-black' : `bg-black border border-white/10 text-[${THEME.muted}]`}`}
                        >
                            Trail
                        </button>
                    </div>

                    <div className={`bg-black rounded-xl p-4 flex items-center gap-3 border border-white/10`}>
                        <Calendar size={18} className={`text-[${THEME.muted}]`} />
                        <input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="bg-transparent text-white w-full focus:outline-none text-sm font-medium"
                        />
                    </div>

                    <Button fullWidth onClick={handleLogMiles} disabled={!logMilesInput}>Save Run</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-8">
            <div className="text-center py-6">
                <div className={`w-24 h-24 bg-gradient-to-br from-[${THEME.text}] to-[${THEME.accent}] rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(228,57,40,0.3)]`}>
                    <span className="text-3xl font-bold text-black">{profile.name.charAt(0)}</span>
                </div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className={`text-sm text-[${THEME.muted}] mt-1`}>{profile.email}</p>
                <div className="flex justify-center gap-2 mt-3">
                    <div className={`flex items-center gap-2 bg-[${THEME.accent}]/15 border border-[${THEME.accent}]/40 rounded-full px-4 py-1.5`}>
                        <Activity size={13} className={`text-[${THEME.accent}]`} />
                        <span className={`text-sm font-bold text-[${THEME.accent}]`}>{profile.attendanceCount}</span>
                        <span className="text-sm text-white/70 font-medium">Runs Attended</span>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className={`mt-5 flex items-center gap-2 text-sm text-[${THEME.muted}] hover:text-white transition-colors mx-auto`}
                >
                    <LogOut size={14} /> Log Out
                </button>
            </div>

            {/* Rotation / Sole Tracker */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Sole Tracker</h2>
                    <button onClick={() => setAddingShoe(true)} className={`text-[${THEME.accent}] text-sm font-medium flex items-center`}>
                        <Plus size={16} className="mr-1" /> Add Shoe
                    </button>
                </div>

                <div className="space-y-4">
                    {rotation.length === 0 && (
                        <div className={`text-center p-6 border border-dashed border-white/10 rounded-2xl text-[${THEME.muted}]`}>
                            <p className="mb-2">No active shoes.</p>
                            <p className="text-xs">Add a shoe to track mileage and wear.</p>
                        </div>
                    )}
                    {rotation.map(shoe => {
                        const progress = Math.min((shoe.miles / shoe.threshold) * 100, 100);
                        const statusColor = progress > 90 ? '#ef4444' : progress > 70 ? '#f59e0b' : THEME.accent;

                        return (
                            <Card key={shoe.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-4">
                                        {shoe.image && (
                                            <img src={shoe.image} alt="" referrerPolicy="no-referrer" className={`w-12 h-12 rounded-lg object-contain p-1 bg-[${THEME.bg}]`} />
                                        )}
                                        <div>
                                            <h3 className="font-bold text-lg">{shoe.name}</h3>
                                            <div className={`text-xs text-[${THEME.muted}]`}>{shoe.nickname || 'Rotation'}</div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleDeleteShoe(e, shoe.id)} className={`text-[${THEME.muted}] hover:text-red-400 p-2 -mr-2`}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="mb-3 mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-mono text-white">{shoe.miles} mi</span>
                                        <span className={`text-[${THEME.muted}]`}>{shoe.threshold} mi limit</span>
                                    </div>
                                    <div className={`h-2 bg-[${THEME.bg}] rounded-full overflow-hidden`}>
                                        <div
                                            className="h-full transition-all duration-500"
                                            style={{ width: `${progress}%`, backgroundColor: statusColor }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    onClick={() => setShowLogModal(shoe.id)}
                                >
                                    <Activity size={14} className="mr-2" /> Log Activity
                                </Button>

                                {progress >= 100 && (
                                    <div className={`mt-3 bg-[${THEME.accent}]/10 p-2 rounded text-xs text-[${THEME.accent}] flex items-center gap-2`}>
                                        <AlertCircle size={14} /> Discount Unlocked! Show in store.
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Privacy & Data */}
            <div>
                <SectionHeader title="Privacy & Data" />
                <Card className="p-0 overflow-hidden">
                    <div className={`p-4 border-b border-white/5 bg-[${THEME.surface}]`}>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Shield size={16} className={`text-[${THEME.accent}]`} />
                            On-Device Storage
                        </div>
                        <p className={`text-xs text-[${THEME.muted}] mt-1`}>Data stays on this device. No cloud sync.</p>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className={`text-[${THEME.muted}]`}>Storage Used</span>
                            <span className="font-mono">{privacyAudit.storageUsed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className={`text-[${THEME.muted}]`}>Profile Type</span>
                            <span>Local / Offline</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className={`text-[${THEME.muted}]`}>Data Points</span>
                            <span>{rotation.length} shoes, {profile.attendanceCount} events</span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/5">
                            <Button fullWidth variant="danger" size="sm" onClick={() => {
                                if (confirm("Permanently delete local profile and reset app?")) {
                                    storageService.wipeData();
                                }
                            }}>
                                <Trash2 size={14} className="mr-2" /> Delete All Data
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {addingShoe && createPortal(AddShoeModal, document.body)}
            {showLogModal && createPortal(LogMilesModal, document.body)}
        </div>
    );
};