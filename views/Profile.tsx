import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Settings, Trash2, Shield, Plus, Activity, AlertCircle, X, Check,
    Calendar, LogOut, Archive, ChevronDown, ChevronUp, Zap, Code,
    Package, Bell, BellOff, ShoppingBag, RefreshCw, Terminal, Database,
    Map, Users, Clock, CheckCircle, Footprints, UserCheck
} from 'lucide-react';
import { Card, Button, SectionHeader, Input, Badge } from '../components/UI';
import { storageService } from '../services/storage';
import { NotificationService } from '../services/notifications';
import { ShoeRotationItem, RunLog, TerrainType, ShoeType, Order, Shoe, Trail, Event } from '../types';
import { INVENTORY, TRAILS, EVENTS } from '../constants';
import { THEME } from '../theme';
import { LocalNotifications } from '@capacitor/local-notifications';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SHOE_TYPE_LIMITS: Record<ShoeType, number> = {
    'Daily Trainer': 400,
    'Racer': 200,
    'Racing Flat': 200,
    'Trail': 350,
    'Other': 350,
};

// Auto-detect mileage limit from shoe data
const getMileageLimit = (shoe: ShoeRotationItem): number => {
    if (shoe.shoeType) return SHOE_TYPE_LIMITS[shoe.shoeType] ?? 350;
    // Fall back to inventory category
    const inv = INVENTORY.find(s => s.id === shoe.shoeId);
    if (inv) {
        if (inv.category === 'Trail') return 350;
        if (inv.cushion === 'Firm') return 200; // racers/super shoes
        return 400; // daily trainers
    }
    return shoe.threshold ?? 350;
};

const TERRAIN_CONFIG: { type: TerrainType; label: string; color: string; icon: React.ReactNode }[] = [
    { type: 'Road', label: 'Road', color: '#6366f1', icon: <Footprints size={16} /> },
    { type: 'Trail', label: 'Trail', color: '#22c55e', icon: <Map size={14} /> },
    { type: 'Track', label: 'Track', color: '#f59e0b', icon: <RefreshCw size={14} /> },
    { type: 'Treadmill', label: 'Treadmill', color: '#06b6d4', icon: <Activity size={14} /> },
    { type: 'Mixed', label: 'Mixed', color: '#a855f7', icon: <Zap size={14} /> },
];

function showBrowserNotification(title: string, body: string) {
    if ('Notification' in window) {
        Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification(title, { body });
        });
    }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toastTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Component ────────────────────────────────────────────────────────────────
export const Profile: React.FC<{ onLogout: () => void; onNavigate?: (tab: string, params?: any) => void; onProductClick?: (shoe: any) => void }> = ({ onLogout, onNavigate, onProductClick }) => {
    const [profile, setProfile] = useState(storageService.getProfile());
    const [rotation, setRotation] = useState(storageService.getRotation());
    const [retiredShoes, setRetiredShoes] = useState(storageService.getRetiredShoes());
    const [privacyAudit] = useState(storageService.getPrivacyAudit());
    const [orders] = useState(() => storageService.getOrders());
    const [notifPrefs, setNotifPrefsState] = useState(storageService.getNotificationPrefs());
    const [toast, setToast] = useState<string | null>(null); // used only inside dev menu
    const [devMode, setDevMode] = useState(storageService.isDevModeEnabled());
    const [showOrders, setShowOrders] = useState(false);

    // Dev mode tap counter
    const tapTimestamps = useRef<number[]>([]);
    const handleAvatarTap = useCallback(() => {
        const now = Date.now();
        tapTimestamps.current = [...tapTimestamps.current.filter(t => now - t < 2000), now];
        if (tapTimestamps.current.length >= 5) {
            tapTimestamps.current = [];
            const next = !devMode;
            storageService.setDevMode(next);
            setDevMode(next);
            // No toast — dev mode silently toggles (DEV badge on avatar shows state)
        }
    }, [devMode]);

    const showToast = (msg: string) => {
        setToast(msg);
        if (_toastTimeout) clearTimeout(_toastTimeout);
        _toastTimeout = setTimeout(() => setToast(null), 2500);
    };

    // Log miles modal
    const [showLogModal, setShowLogModal] = useState<string | null>(null);
    const [logMilesInput, setLogMilesInput] = useState('');
    const [logTerrain, setLogTerrain] = useState<TerrainType>('Road');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

    // Run history accordion
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

    // Retired shoes accordion
    const [showRetired, setShowRetired] = useState(false);

    // Add shoe modal
    const [addingShoe, setAddingShoe] = useState(false);
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
    const [customName, setCustomName] = useState('');
    const [shoeSearch, setShoeSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('All');
    const [addShoeType, setAddShoeType] = useState<ShoeType>('Daily Trainer');

    // Dev menu
    const [showDevMenu, setShowDevMenu] = useState(false);
    const [showRetiredModal, setShowRetiredModal] = useState(false);

    const ALL_BRANDS_ROT = ['All', ...Array.from(new Set(INVENTORY.map(s => s.brand))).sort()];
    const filteredShoes = INVENTORY.filter(s => {
        const matchesBrand = brandFilter === 'All' || s.brand === brandFilter;
        const q = shoeSearch.toLowerCase();
        const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q);
        return matchesBrand && matchesSearch;
    });

    if (profile.isGuest) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Shield size={48} className={`text-[${THEME.muted}] mb-4`} />
                <h2 className="text-xl font-bold mb-2">Guest Mode</h2>
                <p className={`text-[${THEME.muted}] mb-6`}>Create a secure local profile to unlock the Sole Tracker, multi-shoe rotation, and discount rewards.</p>
                <Button onClick={() => storageService.wipeData()} className="mb-3">Create Profile</Button>
                <button onClick={onLogout} className={`flex items-center gap-2 text-sm text-[${THEME.muted}] hover:text-white transition-colors`}>
                    <LogOut size={14} /> Sign Out
                </button>
            </div>
        );
    }

    const handleLogMiles = () => {
        if (showLogModal && logMilesInput) {
            const miles = parseFloat(logMilesInput);
            if (isNaN(miles) || miles <= 0) return;
            const runLog: RunLog = {
                id: Date.now().toString(),
                date: logDate,
                miles,
                terrain: logTerrain,
            };
            storageService.updateRotationShoe(showLogModal, miles, runLog);
            storageService.updateProfile({ milesRun: (profile.milesRun || 0) + miles });
            setRotation(storageService.getRotation());
            setProfile(storageService.getProfile());
            setShowLogModal(null);
            setLogMilesInput('');
            setLogTerrain('Road');
            setLogDate(new Date().toISOString().split('T')[0]);

            // Mileage alert check
            if (notifPrefs.mileageAlerts) {
                const shoe = storageService.getRotation().find(s => s.id === showLogModal);
                if (shoe) {
                    const limit = getMileageLimit(shoe);
                    const pct = (shoe.miles / limit) * 100;
                    if (pct >= 90) {
                        NotificationService.scheduleMileageAlert(shoe.name, shoe.miles, limit);
                    }
                }
            }

            // Post-run congrats
            NotificationService.schedulePostRunCongrats(miles);
        }
    };

    const handleAddShoe = () => {
        let shoeName = customName;
        let shoeImg: string | undefined;
        let shoeIdRef = 'custom';
        if (selectedInventoryId) {
            const invShoe = INVENTORY.find(s => s.id === selectedInventoryId);
            if (invShoe) { shoeName = invShoe.name; shoeImg = invShoe.image; shoeIdRef = invShoe.id; }
        }
        if (shoeName) {
            // Auto-detect shoe type / limit from inventory entry
            const invShoe = INVENTORY.find(s => s.id === selectedInventoryId);
            let autoType: ShoeType = 'Other';
            if (invShoe) {
                if (invShoe.category === 'Trail') autoType = 'Trail';
                else if (invShoe.cushion === 'Firm') autoType = 'Racer';
                else autoType = 'Daily Trainer';
            }
            const limit = SHOE_TYPE_LIMITS[autoType] ?? 350;
            const newShoe: ShoeRotationItem = {
                id: Date.now().toString(),
                shoeId: shoeIdRef,
                name: shoeName,
                miles: 0,
                threshold: limit,
                image: shoeImg,
                shoeType: autoType,
                runLogs: [],
            };
            storageService.addToRotation(newShoe);
            setRotation(storageService.getRotation());
            setAddingShoe(false);
            setCustomName(''); setSelectedInventoryId(''); setShoeSearch(''); setBrandFilter('All');
        }
    };

    const handleRetire = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Retire this shoe? It will be moved to the Retired Vault.')) {
            storageService.retireShoe(id);
            setRotation(storageService.getRotation());
            setRetiredShoes(storageService.getRetiredShoes());
        }
    };

    const updateNotifPref = (key: keyof typeof notifPrefs, val: boolean) => {
        storageService.updateNotificationPrefs({ [key]: val });
        setNotifPrefsState(storageService.getNotificationPrefs());
    };

    // ── Log Miles Modal ──────────────────────────────────────────────────────
    const LogMilesModal = (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogModal(null)} />
            <div className={`bg-[${THEME.surface}] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 p-6 animate-in slide-in-from-bottom duration-300`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Log Activity</h3>
                    <button onClick={() => setShowLogModal(null)}><X size={20} className={`text-[${THEME.muted}]`} /></button>
                </div>
                <div className="space-y-5">
                    <div className="flex items-center justify-center py-4 bg-black/30 rounded-2xl">
                        <input
                            type="number"
                            value={logMilesInput}
                            onChange={e => setLogMilesInput(e.target.value)}
                            placeholder="0.0"
                            className="bg-transparent text-5xl font-bold text-center w-full focus:outline-none text-[#A3EBB1] placeholder:text-white/10"
                            autoFocus
                        />
                    </div>
                    <p className={`text-center text-[${THEME.muted}] -mt-4 text-sm font-medium`}>Miles</p>

                    {/* Terrain selector */}
                    <div className="grid grid-cols-5 gap-2">
                        {TERRAIN_CONFIG.map(t => (
                            <button
                                key={t.type}
                                onClick={() => setLogTerrain(t.type)}
                                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${logTerrain === t.type ? 'scale-105' : 'opacity-50'}`}
                                style={{ background: logTerrain === t.type ? `${t.color}25` : 'rgba(255,255,255,0.03)', border: `1px solid ${logTerrain === t.type ? t.color : 'rgba(255,255,255,0.08)'}`, color: logTerrain === t.type ? t.color : '#fff' }}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className={`bg-black rounded-xl p-4 flex items-center gap-3 border border-white/10`}>
                        <Calendar size={18} className={`text-[${THEME.muted}]`} />
                        <input
                            type="date"
                            value={logDate}
                            onChange={e => setLogDate(e.target.value)}
                            className="bg-transparent text-white w-full focus:outline-none text-sm font-medium"
                        />
                    </div>
                    <Button fullWidth onClick={handleLogMiles} disabled={!logMilesInput}>Save Run</Button>
                </div>
            </div>
        </div>
    );

    // ── Add Shoe Modal ───────────────────────────────────────────────────────
    const SHOE_TYPES: ShoeType[] = ['Daily Trainer', 'Racer', 'Racing Flat', 'Trail', 'Other'];
    const AddShoeModal = (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setAddingShoe(false); setShoeSearch(''); setBrandFilter('All'); }} />
            <div className={`bg-[${THEME.surface}] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 animate-in slide-in-from-bottom duration-300 flex flex-col`} style={{ height: '90vh' }}>
                <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-xl text-white">Add to Rotation</h3>
                        <p className={`text-xs text-[${THEME.muted}] mt-0.5`}>{filteredShoes.length} shoes available</p>
                    </div>
                    <button onClick={() => { setAddingShoe(false); setShoeSearch(''); setBrandFilter('All'); }} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Search bar */}
                <div className="px-5 pb-3 flex-shrink-0">
                    <div className={`flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-4 h-11 focus-within:border-[${THEME.accent}] transition-colors`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[${THEME.muted}] flex-shrink-0`}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input type="text" placeholder="Search by name or brand..." value={shoeSearch} onChange={e => setShoeSearch(e.target.value)} className={`bg-transparent text-white placeholder:text-[${THEME.muted}] text-sm w-full focus:outline-none`} autoFocus />
                        {shoeSearch && <button onClick={() => setShoeSearch('')} className={`text-[${THEME.muted}]`}><X size={14} /></button>}
                    </div>
                </div>

                {/* Brand filter pills */}
                <div className="px-5 pb-3 flex-shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {ALL_BRANDS_ROT.map(brand => (
                            <button key={brand} onClick={() => setBrandFilter(brand)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${brandFilter === brand ? `bg-[${THEME.accent}] text-white` : `bg-white/5 text-white/50 border border-white/10`}`}>
                                {brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shoe grid */}
                <div className="flex-1 overflow-y-auto px-5 pb-3 custom-scrollbar">
                    {filteredShoes.length === 0 ? (
                        <div className={`text-center py-12 text-[${THEME.muted}]`}>No shoes match "{shoeSearch}"</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredShoes.map(shoe => {
                                const isSelected = selectedInventoryId === shoe.id;
                                return (
                                    <button key={shoe.id} onClick={() => { setSelectedInventoryId(shoe.id); setCustomName(''); }}
                                        className={`relative text-left rounded-2xl border transition-all duration-150 overflow-hidden ${isSelected ? `border-[${THEME.accent}] ring-1 ring-[${THEME.accent}]` : 'border-white/10 hover:border-white/20'}`}>
                                        <div className="aspect-square bg-black relative">
                                            <img src={shoe.image} alt={shoe.name} referrerPolicy="no-referrer" className="w-full h-full object-cover object-center scale-105" />
                                            {isSelected && <div className={`absolute top-2 right-2 bg-[${THEME.accent}] rounded-full p-1`}><Check size={11} className="text-white" /></div>}
                                        </div>
                                        <div className={`p-2.5 bg-[${THEME.surface}]`}>
                                            <p className={`text-[10px] text-[${THEME.muted}] font-medium`}>{shoe.brand}</p>
                                            <p className="text-xs font-bold text-white leading-tight line-clamp-2 mt-0.5">{shoe.name}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <div className="my-4 flex items-center gap-3">
                        <div className="flex-1 border-t border-white/10" />
                        <span className={`text-xs text-[${THEME.muted}]`}>or enter manually</span>
                        <div className="flex-1 border-t border-white/10" />
                    </div>
                    <div className={`flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl px-4 h-12 focus-within:border-[${THEME.accent}]/50 transition-colors`}>
                        <input placeholder="Custom shoe name..." value={customName} onChange={e => { setCustomName(e.target.value); setSelectedInventoryId(''); }}
                            className={`bg-transparent text-white placeholder:text-[${THEME.muted}] text-sm w-full focus:outline-none`} />
                    </div>
                </div>

                <div className="p-5 pt-3 border-t border-white/5 flex-shrink-0">
                    <Button fullWidth onClick={handleAddShoe} disabled={!selectedInventoryId && !customName}>
                        {selectedInventoryId ? `Add ${INVENTORY.find(s => s.id === selectedInventoryId)?.name ?? 'Shoe'}` : customName ? `Add "${customName}"` : 'Select a shoe above'}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-8">
            {/* No top toast for dev mode — silently toggles */}

            {/* Profile header */}
            <div className="text-center py-6">
                <button
                    onClick={handleAvatarTap}
                    className={`w-24 h-24 bg-gradient-to-br from-[${THEME.text}] to-[${THEME.accent}] rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(228,57,40,0.3)] active:scale-95 transition-transform relative select-none`}
                >
                    <span className="text-3xl font-bold text-black">{profile.name.charAt(0)}</span>
                </button>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className={`text-sm text-[${THEME.muted}] mt-1`}>{profile.email}</p>
                <div className="flex justify-center gap-2 mt-3">
                    <div className={`flex items-center gap-2 bg-[${THEME.accent}]/15 border border-[${THEME.accent}]/40 rounded-full px-4 py-1.5`}>
                        <Activity size={13} className={`text-[${THEME.accent}]`} />
                        <span className={`text-sm font-bold text-[${THEME.accent}]`}>{profile.attendanceCount}</span>
                        <span className="text-sm text-white/70 font-medium">Runs Attended</span>
                    </div>
                </div>
                {devMode && (
                    <button
                        onClick={() => setShowDevMenu(true)}
                        className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 text-xs font-bold"
                    >
                        <Terminal size={13} /> Open Dev Menu
                    </button>
                )}
                <button onClick={onLogout} className={`mt-4 flex items-center gap-2 text-sm text-[${THEME.muted}] hover:text-white transition-colors mx-auto`}>
                    <LogOut size={14} /> Log Out
                </button>
            </div>

            {/* ── Sole Tracker ─────────────────────────────────────────────── */}
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
                        const limit = getMileageLimit(shoe);
                        const progress = Math.min((shoe.miles / limit) * 100, 100);
                        const statusColor = progress > 90 ? '#ef4444' : progress > 70 ? '#f59e0b' : THEME.accent;
                        const isExpanded = expandedHistory === shoe.id;
                        const logs = shoe.runLogs ?? [];

                        return (
                            <Card key={shoe.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-4">
                                        {shoe.image && <img src={shoe.image} alt="" referrerPolicy="no-referrer" className={`w-12 h-12 rounded-lg object-contain p-1 bg-[${THEME.bg}]`} />}
                                        <div>
                                            <h3 className="font-bold text-lg">{shoe.name}</h3>
                                            <div className={`text-xs text-[${THEME.muted}]`}>{shoe.shoeType ?? 'Rotation'}</div>
                                        </div>
                                    </div>
                                    <button onClick={e => handleRetire(e, shoe.id)} className={`text-[${THEME.muted}] hover:text-amber-400 p-2 -mr-2 flex items-center gap-1 text-xs`}>
                                        <Archive size={15} />
                                    </button>
                                </div>

                                <div className="mb-3 mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-mono text-white">{shoe.miles.toFixed(1)} mi</span>
                                        <span className={`text-[${THEME.muted}]`}>{limit} mi limit</span>
                                    </div>
                                    <div className={`h-2 bg-[${THEME.bg}] rounded-full overflow-hidden`}>
                                        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: statusColor }} />
                                    </div>
                                </div>

                                <Button variant="secondary" size="sm" fullWidth onClick={() => setShowLogModal(shoe.id)}>
                                    <Activity size={14} className="mr-2" /> Log Activity
                                </Button>

                                {/* Run history toggle */}
                                {logs.length > 0 && (
                                    <button
                                        onClick={() => setExpandedHistory(isExpanded ? null : shoe.id)}
                                        className={`mt-3 w-full flex items-center justify-between text-xs text-[${THEME.muted}] hover:text-white transition-colors`}
                                    >
                                        <span>{logs.length} run{logs.length > 1 ? 's' : ''} logged</span>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                )}
                                {isExpanded && (
                                    <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                                        {[...logs].reverse().map(log => {
                                            const tc = TERRAIN_CONFIG.find(t => t.type === log.terrain);
                                            return (
                                                <div key={log.id} className="flex items-center justify-between text-xs py-1">
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ color: tc?.color ?? '#fff' }}>{tc?.icon}</span>
                                                        <span className={`text-[${THEME.muted}]`}>{log.date}</span>
                                                    </div>
                                                    <span className="font-mono text-white">{log.miles.toFixed(1)} mi</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {progress >= 100 && (
                                    <div className={`mt-3 bg-[${THEME.accent}]/10 p-2 rounded text-xs text-[${THEME.accent}] flex items-center gap-2`}>
                                        <AlertCircle size={14} /> Discount Unlocked! Show in store.
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Retired Shoes — compact row entry point */}
                {retiredShoes.length > 0 && (
                    <div className="mt-6">
                        <button
                            onClick={() => setShowRetiredModal(true)}
                            className={`w-full flex items-center justify-between p-4 bg-[${THEME.surface}] rounded-2xl`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                                    <Archive size={17} className="text-amber-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Retired Shoes</p>
                                    <p className={`text-xs text-[${THEME.muted}]`}>{retiredShoes.length} shoe{retiredShoes.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-[${THEME.muted}] -rotate-90`} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Order History — compact row ────────────────────────────── */}
            <div>
                <SectionHeader title="Order History" />
                <button
                    onClick={() => setShowOrders(true)}
                    className={`w-full flex items-center justify-between p-4 bg-[${THEME.surface}] rounded-2xl`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-[${THEME.accent}]/15 flex items-center justify-center flex-shrink-0`}>
                            <ShoppingBag size={17} className={`text-[${THEME.accent}]`} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">My Orders</p>
                            <p className={`text-xs text-[${THEME.muted}]`}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <ChevronDown size={16} className={`text-[${THEME.muted}] -rotate-90`} />
                </button>
            </div>

            {/* ── Notification Preferences ──────────────────────────────────── */}
            <div>
                <SectionHeader title="Preferences" />
                <Card className="p-0 overflow-hidden">
                    <div className="divide-y divide-white/5">
                        {[
                            { key: 'cartReminders' as const, label: 'Cart Reminders', desc: 'Remind me about items in my bag after 24h', icon: <ShoppingBag size={16} /> },
                            { key: 'mileageAlerts' as const, label: 'Mileage Alerts', desc: 'Warn me when a shoe approaches its limit', icon: <Activity size={16} /> },
                            { key: 'runLogCongrats' as const, label: 'Post-Run Congrats', desc: 'Cheer me on after logging a run', icon: <UserCheck size={16} /> },
                            { key: 'eventReminders' as const, label: 'Event Reminders', desc: 'Alert me before an RSVP\'d group run', icon: <Calendar size={16} /> },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`text-[${THEME.accent}]`}>{item.icon}</div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.label}</p>
                                        <p className={`text-xs text-[${THEME.muted}]`}>{item.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateNotifPref(item.key, !notifPrefs[item.key])}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${notifPrefs[item.key] ? `bg-[${THEME.accent}]` : 'bg-white/10'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ── Privacy & Data ────────────────────────────────────────────── */}
            <div>
                <SectionHeader title="Privacy & Data" />
                <Card className="p-0 overflow-hidden">
                    <div className={`p-4 border-b border-white/5 bg-[${THEME.surface}]`}>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Shield size={16} className={`text-[${THEME.accent}]`} /> On-Device Storage
                        </div>
                        <p className={`text-xs text-[${THEME.muted}] mt-1`}>Data stays on this device. No cloud sync.</p>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className={`text-[${THEME.muted}]`}>Storage Used</span>
                            <span className="font-mono">{privacyAudit.storageUsed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className={`text-[${THEME.muted}]`}>Data Points</span>
                            <span>{rotation.length} shoes, {profile.attendanceCount} events</span>
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <Button fullWidth variant="danger" size="sm" onClick={() => { if (confirm('Permanently delete local profile and reset app?')) storageService.wipeData(); }}>
                                <Trash2 size={14} className="mr-2" /> Delete All Data
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {addingShoe && createPortal(AddShoeModal, document.body)}
            {showLogModal && createPortal(LogMilesModal, document.body)}
            {showDevMenu && createPortal(<DevMenuModal onClose={() => setShowDevMenu(false)} showToast={showToast} />, document.body)}
            {showOrders && createPortal(
                <OrderHistoryModal
                    orders={orders}
                    onClose={() => setShowOrders(false)}
                    onProductClick={onProductClick}
                />,
                document.body
            )}
            {showRetiredModal && createPortal(
                <RetiredShoesModal
                    shoes={retiredShoes}
                    onClose={() => setShowRetiredModal(false)}
                />,
                document.body
            )}
        </div>
    );
};

// ─── Retired Shoes Modal ─────────────────────────────────────────────────────────
const RetiredShoesModal: React.FC<{ shoes: ShoeRotationItem[]; onClose: () => void }> = ({ shoes, onClose }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    return (
        <div className="fixed inset-0 z-[6000] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`bg-[${THEME.bg}] w-full max-w-md rounded-t-[32px] relative z-10 border-t border-white/10 flex flex-col`} style={{ height: '88vh' }}>
                {/* Header */}
                <div className="flex justify-between items-center px-5 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
                    <div>
                        <h3 className="font-black text-xl text-white">Retired Shoes</h3>
                        <p className={`text-xs text-[${THEME.muted}] mt-0.5`}>{shoes.length} shoe{shoes.length !== 1 ? 's' : ''} · Lifetime mileage history</p>
                    </div>
                    <button onClick={onClose} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Shoes list */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
                    {shoes.map(shoe => {
                        const limit = getMileageLimit(shoe);
                        const pct = Math.min((shoe.miles / limit) * 100, 100);
                        const logs = shoe.runLogs ?? [];
                        const isExpanded = expandedId === shoe.id;
                        return (
                            <div key={shoe.id} className={`bg-[${THEME.surface}] rounded-2xl overflow-hidden border border-white/5`}>
                                {/* Shoe header */}
                                <div className="flex gap-4 p-4">
                                    {shoe.image
                                        ? <img src={shoe.image} alt={shoe.name} referrerPolicy="no-referrer" className={`w-16 h-16 rounded-xl object-contain p-1.5 bg-black grayscale flex-shrink-0`} />
                                        : <div className={`w-16 h-16 rounded-xl bg-black/50 flex items-center justify-center flex-shrink-0`}><Archive size={24} className="text-amber-400" /></div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-bold text-white text-base leading-tight">{shoe.name}</p>
                                            {shoe.shoeType && (
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/25 flex-shrink-0`}>
                                                    {shoe.shoeType}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs text-[${THEME.muted}] mt-0.5`}>Retired {shoe.retiredAt ?? 'Unknown'}</p>
                                        {/* Mileage bar */}
                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="font-mono text-white">{shoe.miles.toFixed(1)} mi logged</span>
                                                <span className={`text-[${THEME.muted}]`}>{limit} mi limit</span>
                                            </div>
                                            <div className={`h-1.5 bg-[${THEME.bg}] rounded-full overflow-hidden`}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${pct}%`, background: pct >= 90 ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Run history toggle */}
                                {logs.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : shoe.id)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 border-t border-white/5 text-xs font-semibold transition-colors ${isExpanded ? `text-[${THEME.accent}]` : `text-[${THEME.muted}] hover:text-white`}`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Activity size={12} />
                                                {logs.length} run{logs.length > 1 ? 's' : ''} logged
                                            </span>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-2">
                                                {[...logs].reverse().map(log => {
                                                    const tc = TERRAIN_CONFIG.find(t => t.type === log.terrain);
                                                    return (
                                                        <div key={log.id} className={`flex items-center justify-between py-1.5 px-3 rounded-xl bg-black/30`}>
                                                            <div className="flex items-center gap-2">
                                                                <span style={{ color: tc?.color ?? '#fff' }}>{tc?.icon}</span>
                                                                <div>
                                                                    <p className="text-xs text-white font-medium">{log.date}</p>
                                                                    <p className={`text-[10px] text-[${THEME.muted}]`}>{tc?.label ?? log.terrain}</p>
                                                                </div>
                                                            </div>
                                                            <span className="font-mono text-white text-xs">{log.miles.toFixed(1)} mi</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ─── Dev Menu Modal ───────────────────────────────────────────────────────────
const DevMenuModal: React.FC<{ onClose: () => void; showToast: (msg: string) => void }> = ({ onClose, showToast }) => {
    const [activeTab, setActiveTab] = useState<'shoe' | 'trail' | 'event' | 'notif' | 'data'>('shoe');
    const rawData = storageService.getRawData();

    // Add Shoe form
    const [shoeForm, setShoeForm] = useState({ name: '', brand: 'Brooks', price: '', description: '', drop: '', weight: '', photoUrl: '', tags: '', staffTake: '', gender: 'Unisex', category: 'Road', support: 'Neutral', cushion: 'Balanced' });
    const handleAddDevShoe = () => {
        if (!shoeForm.name) return;
        const shoe: Shoe = {
            id: `custom-${Date.now()}`,
            name: shoeForm.name,
            brand: shoeForm.brand as any,
            price: parseFloat(shoeForm.price) || 0,
            description: shoeForm.description,
            drop: parseFloat(shoeForm.drop) || 0,
            weight: parseFloat(shoeForm.weight) || 0,
            image: shoeForm.photoUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
            category: shoeForm.category as any,
            support: shoeForm.support as any,
            cushion: shoeForm.cushion as any,
            gender: shoeForm.gender as any,
            tags: shoeForm.tags.split(',').map(t => t.trim()).filter(Boolean),
            staffTake: shoeForm.staffTake,
        };
        storageService.addCustomShoe(shoe);
        showToast(`✅ Added "${shoe.name}" to inventory`);
        setShoeForm({ name: '', brand: 'Brooks', price: '', description: '', drop: '', weight: '', photoUrl: '', tags: '', staffTake: '', gender: 'Unisex', category: 'Road', support: 'Neutral', cushion: 'Balanced' });
    };

    // Add Trail form
    const [trailForm, setTrailForm] = useState({ name: '', distance: '', surface: 'Paved', description: '', status: 'Open', photo: '', parkingInfo: '', highlights: '' });
    const handleAddTrail = () => {
        if (!trailForm.name) return;
        const trail: Trail = {
            id: `custom-trail-${Date.now()}`,
            name: trailForm.name, distance: trailForm.distance, surface: trailForm.surface,
            description: trailForm.description, status: trailForm.status as any,
            highlights: trailForm.highlights.split(',').map(h => h.trim()).filter(Boolean),
            parkingInfo: trailForm.parkingInfo, photo: trailForm.photo,
        };
        storageService.addCustomTrail(trail);
        showToast(`✅ Trail "${trail.name}" added`);
        setTrailForm({ name: '', distance: '', surface: 'Paved', description: '', status: 'Open', photo: '', parkingInfo: '', highlights: '' });
    };

    // Add Event form
    const [eventForm, setEventForm] = useState({ name: '', day: '', time: '', description: '', paceGroups: '' });
    const handleAddEvent = () => {
        if (!eventForm.name) return;
        const event: Event = {
            id: `custom-event-${Date.now()}`,
            name: eventForm.name, day: eventForm.day, time: eventForm.time,
            description: eventForm.description,
            paceGroups: eventForm.paceGroups.split(',').map(p => p.trim()).filter(Boolean),
        };
        storageService.addCustomEvent(event);
        showToast(`✅ Group Run "${event.name}" added`);
        setEventForm({ name: '', day: '', time: '', description: '', paceGroups: '' });
    };

    const devField = (label: string, value: string, onChange: (v: string) => void, placeholder?: string, type = 'text') => (
        <div className="space-y-1">
            <label className={`text-[10px] font-bold text-[${THEME.muted}] uppercase`}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className={`w-full bg-black/40 border border-white/10 rounded-xl px-3 h-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[${THEME.accent}]/50`} />
        </div>
    );
    const devSelect = (label: string, value: string, onChange: (v: string) => void, options: string[]) => (
        <div className="space-y-1">
            <label className={`text-[10px] font-bold text-[${THEME.muted}] uppercase`}>{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className={`w-full bg-black/40 border border-white/10 rounded-xl px-3 h-10 text-sm text-white focus:outline-none focus:border-[${THEME.accent}]/50`}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    const TABS = [
        { id: 'shoe', label: 'Inventory', icon: <Package size={13} /> },
        { id: 'trail', label: 'Trail', icon: <Map size={13} /> },
        { id: 'event', label: 'Run Group', icon: <Users size={13} /> },
        { id: 'notif', label: 'Notifs', icon: <Bell size={13} /> },
        { id: 'data', label: 'Raw Data', icon: <Database size={13} /> },
    ] as const;

    return (
        <div className="fixed inset-0 z-[6000] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0a0a0a] border-t border-amber-400/30 w-full max-w-md relative z-10 rounded-t-[32px] flex flex-col" style={{ height: '92vh' }}>
                {/* Header */}
                <div className="flex justify-between items-center px-5 pt-5 pb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Terminal size={18} className="text-amber-400" />
                        <h3 className="font-black text-lg text-white">Developer Menu</h3>
                        <span className="bg-amber-400/20 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded">INTERNAL</span>
                    </div>
                    <button onClick={onClose} className="bg-white/5 p-2 rounded-full"><X size={16} className="text-white" /></button>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 px-5 pb-3 flex-shrink-0 overflow-x-auto hide-scrollbar">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/5 text-white/40'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-6 custom-scrollbar space-y-4">
                    {/* ── Add Inventory ── */}
                    {activeTab === 'shoe' && <>
                        <p className={`text-xs text-[${THEME.muted}]`}>Add a shoe to the inventory. It will appear in the Shop immediately.</p>
                        {devField('Shoe Name *', shoeForm.name, v => setShoeForm(p => ({ ...p, name: v })), 'e.g. Pegasus 41')}
                        {devField('Photo URL', shoeForm.photoUrl, v => setShoeForm(p => ({ ...p, photoUrl: v })), 'https://...')}
                        {devSelect('Brand', shoeForm.brand, v => setShoeForm(p => ({ ...p, brand: v })), ['Brooks', 'Nike', 'Hoka', 'Saucony', 'ASICS', 'New Balance', 'Adidas', 'Altra', 'ON Running', 'Mizuno', 'Puma', 'Salomon'])}
                        {devSelect('Gender', shoeForm.gender, v => setShoeForm(p => ({ ...p, gender: v })), ["Men's", "Women's", 'Unisex'])}
                        {devSelect('Category', shoeForm.category, v => setShoeForm(p => ({ ...p, category: v })), ['Road', 'Trail', 'Track', 'Cross-Training'])}
                        {devSelect('Support Type', shoeForm.support, v => setShoeForm(p => ({ ...p, support: v })), ['Neutral', 'Stability', 'Motion Control'])}
                        {devSelect('Cushion Level', shoeForm.cushion, v => setShoeForm(p => ({ ...p, cushion: v })), ['Firm', 'Balanced', 'Plush'])}
                        {devField('Price ($)', shoeForm.price, v => setShoeForm(p => ({ ...p, price: v })), '140', 'number')}
                        {devField('Drop (mm)', shoeForm.drop, v => setShoeForm(p => ({ ...p, drop: v })), '8', 'number')}
                        {devField('Weight (oz)', shoeForm.weight, v => setShoeForm(p => ({ ...p, weight: v })), '9.5', 'number')}
                        {devField('Tags (comma separated)', shoeForm.tags, v => setShoeForm(p => ({ ...p, tags: v })), 'plush, carbon, fast')}
                        {devField('Description', shoeForm.description, v => setShoeForm(p => ({ ...p, description: v })), 'A versatile daily trainer...')}
                        {devField('Staff Take (optional)', shoeForm.staffTake, v => setShoeForm(p => ({ ...p, staffTake: v })), 'Our staff loves this shoe because...')}
                        <Button fullWidth onClick={handleAddDevShoe} disabled={!shoeForm.name} className="!bg-amber-400 !text-black !shadow-none hover:!bg-amber-300">
                            <Plus size={16} className="mr-2" /> Add to Inventory
                        </Button>
                    </>}

                    {/* ── Add Trail ── */}
                    {activeTab === 'trail' && <>
                        <p className={`text-xs text-[${THEME.muted}]`}>Add a running trail to the Explore page.</p>
                        {devField('Trail Name *', trailForm.name, v => setTrailForm(p => ({ ...p, name: v })), 'e.g. River Loop')}
                        {devField('Distance', trailForm.distance, v => setTrailForm(p => ({ ...p, distance: v })), '3.2 miles')}
                        {devSelect('Surface', trailForm.surface, v => setTrailForm(p => ({ ...p, surface: v })), ['Paved', 'Dirt', 'Gravel', 'Mixed', 'Grass'])}
                        {devSelect('Status', trailForm.status, v => setTrailForm(p => ({ ...p, status: v })), ['Open', 'Muddy', 'Closed'])}
                        {devField('Photo URL', trailForm.photo, v => setTrailForm(p => ({ ...p, photo: v })), 'https://...')}
                        {devField('Description', trailForm.description, v => setTrailForm(p => ({ ...p, description: v })), 'Scenic trail along...')}
                        {devField('Highlights (comma separated)', trailForm.highlights, v => setTrailForm(p => ({ ...p, highlights: v })), 'Great views, Dog-friendly, Shade')}
                        {devField('Parking Info', trailForm.parkingInfo, v => setTrailForm(p => ({ ...p, parkingInfo: v })), 'Free lot at main entrance')}
                        <Button fullWidth onClick={handleAddTrail} disabled={!trailForm.name} className="!bg-amber-400 !text-black !shadow-none">
                            <Plus size={16} className="mr-2" /> Add Trail
                        </Button>
                    </>}

                    {/* ── Add Event ── */}
                    {activeTab === 'event' && <>
                        <p className={`text-xs text-[${THEME.muted}]`}>Add a group run to the Explore page.</p>
                        {devField('Run Name *', eventForm.name, v => setEventForm(p => ({ ...p, name: v })), 'e.g. Wednesday Warriors')}
                        {devField('Day', eventForm.day, v => setEventForm(p => ({ ...p, day: v })), 'Every Wednesday')}
                        {devField('Time', eventForm.time, v => setEventForm(p => ({ ...p, time: v })), '6:00 AM')}
                        {devField('Description', eventForm.description, v => setEventForm(p => ({ ...p, description: v })), 'A fun run for all paces...')}
                        {devField('Pace Groups (comma separated)', eventForm.paceGroups, v => setEventForm(p => ({ ...p, paceGroups: v })), '8:00/mi, 9:30/mi, 11:00/mi')}
                        <Button fullWidth onClick={handleAddEvent} disabled={!eventForm.name} className="!bg-amber-400 !text-black !shadow-none">
                            <Plus size={16} className="mr-2" /> Add Group Run
                        </Button>
                    </>}

                    {/* ── Notification Tester ── */}
                    {activeTab === 'notif' && <>
                        <p className={`text-xs text-[${THEME.muted}]`}>Trigger test push notifications. The browser will ask for permission.</p>
                        <div className="space-y-3">
                            <button onClick={() => { showToast('Scheduling cart reminder (fires in 24h)...'); NotificationService.scheduleCartReminder(); }}
                                className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors">
                                <ShoppingBag size={20} className="text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Test Abandoned Cart</p>
                                    <p className={`text-xs text-[${THEME.muted}]`}>Calls NotificationService (fires 24h)</p>
                                </div>
                            </button>
                            <button onClick={() => { showToast('Sent mileage warning (fires in 5s)...'); NotificationService.scheduleMileageAlert('Pegasus 41', 360, 400); }}
                                className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors">
                                <Activity size={20} className="text-amber-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Test Mileage Warning</p>
                                    <p className={`text-xs text-[${THEME.muted}]`}>Calls NotificationService (fires 5s)</p>
                                </div>
                            </button>
                            <button onClick={async () => {
                                showToast('Sent generic alert (fires in 3s)...');
                                await LocalNotifications.schedule({
                                    notifications: [{
                                        title: '👟 Second Sole',
                                        body: 'Hey! Just checking in on your training. How are your shoes holding up?',
                                        id: Math.floor(Math.random() * 100000),
                                        schedule: { at: new Date(Date.now() + 3000) },
                                        smallIcon: 'ic_stat_icon_config_sample',
                                        iconColor: '#22c55e'
                                    }]
                                });
                            }}
                                className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors">
                                <Bell size={20} className="text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Test Generic Notification</p>
                                    <p className={`text-xs text-[${THEME.muted}]`}>Uses direct Capacitor API (fires 3s)</p>
                                </div>
                            </button>
                        </div>
                    </>}

                    {/* ── Raw Data View ── */}
                    {activeTab === 'data' && <>
                        <p className={`text-xs text-[${THEME.muted}]`}>Raw localStorage state for debugging.</p>
                        <pre className="text-[10px] text-green-400 bg-black/60 rounded-2xl p-4 overflow-x-auto border border-white/5 leading-relaxed">
                            {JSON.stringify(rawData, null, 2)}
                        </pre>
                    </>}
                </div>
            </div>
        </div>
    );
};

// ─── Order History Modal ───────────────────────────────────────────────────────
const OrderHistoryModal: React.FC<{ orders: Order[]; onClose: () => void; onProductClick?: (shoe: any) => void }> = ({ orders, onClose, onProductClick }) => {
    const allInventory = [...INVENTORY, ...storageService.getCustomInventory()];
    return (
        <div className="fixed inset-0 z-[6000] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`bg-[${THEME.bg}] w-full max-w-md rounded-t-[32px] relative z-10 border-t border-white/10 flex flex-col`} style={{ height: '88vh' }}>
                {/* Header */}
                <div className="flex justify-between items-center px-5 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
                    <div>
                        <h3 className="font-black text-xl text-white">Order History</h3>
                        <p className={`text-xs text-[${THEME.muted}] mt-0.5`}>{orders.length} order{orders.length !== 1 ? 's' : ''} · Tap a shoe to view details</p>
                    </div>
                    <button onClick={onClose} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Order list */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
                    {orders.length === 0 ? (
                        <div className={`text-center py-16 text-[${THEME.muted}]`}>
                            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
                            <p>No orders yet</p>
                        </div>
                    ) : orders.map((order, idx) => (
                        <div key={order.id} className="flex gap-4">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-3 h-3 rounded-full bg-[${THEME.accent}] mt-1`} />
                                {idx < orders.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                            </div>
                            <div className={`flex-1 bg-[${THEME.surface}] border border-white/8 rounded-2xl p-4 mb-4`}>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="font-bold text-white text-sm">{order.id}</p>
                                        <p className={`text-xs text-[${THEME.muted}]`}>{order.date}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${order.fulfillmentType === 'Pickup' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
                                        {order.fulfillmentType}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {order.items.map((item, i) => {
                                        const inventoryShoe = allInventory.find(s => s.id === item.shoeId || s.name === item.shoeName);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (inventoryShoe && onProductClick) { onProductClick(inventoryShoe); onClose(); }
                                                    else if (onProductClick) { onClose(); } // still close modal even if shoe not in inventory
                                                }}
                                                className="flex items-center gap-3 w-full text-left group cursor-pointer"
                                            >
                                                <img src={item.image} alt={item.shoeName} referrerPolicy="no-referrer" className="w-14 h-14 rounded-xl object-cover bg-black flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate transition-colors ${inventoryShoe ? 'text-white group-hover:text-amber-300' : 'text-white'}`}>
                                                        {item.shoeName}
                                                    </p>
                                                    <p className={`text-xs text-[${THEME.muted}]`}>{item.brand} · Size {item.size}</p>
                                                    {inventoryShoe && <p className={`text-[10px] text-[${THEME.accent}] mt-0.5`}>Tap to view details →</p>}
                                                </div>
                                                <span className="text-sm font-bold text-white flex-shrink-0">${item.price}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className={`mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-[${THEME.muted}]`}>
                                    <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                                    <span className="font-bold text-white">Total ${order.total}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};