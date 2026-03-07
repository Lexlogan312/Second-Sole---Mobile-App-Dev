import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Star, Plus, X, Check } from 'lucide-react';
import { Card, Badge, Button, SectionHeader } from '../components/UI';
import { INVENTORY } from '../constants';
import { storageService } from '../services/storage';
import { Shoe, Brand, Gender } from '../types';
import { THEME } from '../theme';

interface ShopProps {
    onProductClick: (shoe: Shoe) => void;
    filteredMode?: boolean;
}

// Category color map — every category gets a distinct badge style
const CATEGORY_COLORS: Record<string, string> = {
    Trail: 'bg-amber-500/20 text-amber-400 border border-amber-500/20',
    Track: 'bg-purple-500/20 text-purple-400 border border-purple-500/20',
    Hybrid: 'bg-sky-500/20 text-sky-400 border border-sky-500/20',
    Road: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
};

// Derive unique brand list from inventory at module level
const ALL_BRANDS = [...new Set(INVENTORY.map(s => s.brand))].sort() as Brand[];

// ── Separate matchMode from category so both can be active simultaneously ──
type ActiveFilters = {
    matchMode: boolean;   // true = show only My Matches (composable with all other filters)
    gender: Gender | 'All';
    category: string;     // 'All' | 'Road' | 'Trail' | 'Track' | 'Hybrid'
    brands: Brand[];
    support: string;      // 'All' | 'Neutral' | 'Stability'
    cushion: string;      // 'All' | 'Firm' | 'Balanced' | 'Plush'
};

const DEFAULT_FILTERS: ActiveFilters = {
    matchMode: false,
    gender: 'All',
    category: 'All',
    brands: [],
    support: 'All',
    cushion: 'All',
};

export const Shop: React.FC<ShopProps> = ({ onProductClick, filteredMode = false }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        ...DEFAULT_FILTERS,
        matchMode: filteredMode,
    });
    const profile = storageService.getProfile();

    // Merge static inventory + any custom shoes added via Dev Menu
    const FULL_INVENTORY = useMemo(() => [...INVENTORY, ...storageService.getCustomInventory()], []);

    const displayedInventory = useMemo(() => {
        let filtered = FULL_INVENTORY;

        // 1. My Matches — score-based pre-filter (composable with everything else)
        if (activeFilters.matchMode && !profile.isGuest) {
            const gait = storageService.getGaitProfile();
            filtered = filtered.filter(shoe => {
                let score = 0;

                // ── Terrain / Category match (biggest signal) ──────────────────
                if (gait.terrain) {
                    if (shoe.category === gait.terrain) score += 3;
                    // Hybrid runners also benefit from Road or Trail shoes
                    else if (gait.terrain === 'Hybrid' && (shoe.category === 'Trail' || shoe.category === 'Road')) score += 1;
                }

                // ── Gender preference ─────────────────────────────────────────
                if (gait.gender) {
                    if (shoe.gender === gait.gender || shoe.gender === 'Unisex') score += 1;
                    else return false; // hard filter: wrong gender fit
                }

                // ── Support need (arch + pronation) ──────────────────────────
                const needsStability = gait.pronation === 'Over' || gait.arch === 'Low';
                if (needsStability && shoe.support === 'Stability') score += 2;
                if (!needsStability && shoe.support === 'Neutral') score += 1;

                // ── Cushion preference ────────────────────────────────────────
                if (gait.cushionPref && shoe.cushion === gait.cushionPref) score += 2;
                // High weekly miles → prefer plush
                if (gait.weeklyMiles === 'High' && shoe.cushion === 'Plush') score += 1;

                // ── Heel drop preference ──────────────────────────────────────
                if (gait.dropPref) {
                    const drop = shoe.drop ?? 8;
                    const dropOk =
                        (gait.dropPref === 'Zero' && drop === 0) ||
                        (gait.dropPref === 'Low' && drop >= 1 && drop <= 6) ||
                        (gait.dropPref === 'Medium' && drop >= 7 && drop <= 10) ||
                        (gait.dropPref === 'High' && drop >= 11);
                    if (dropOk) score += 2;
                }

                // ── Foot shape ────────────────────────────────────────────────
                // (We can't perfectly detect wide shoes, but Altra and wide variants score higher)
                if (gait.footShape === 'Wide') {
                    if (shoe.brand === 'Altra' || shoe.id.includes('wide') || shoe.id.includes('4e')) score += 1;
                }

                // ── Distance / Goal alignment ─────────────────────────────────
                if (gait.distanceGoals === 'Speed' || gait.experienceLevel === 'Elite') {
                    // Speed-focused runners match well with Firm/Track shoes
                    if (shoe.cushion === 'Firm' || shoe.category === 'Track') score += 1;
                }
                if ((gait.distanceGoals === 'Long' || gait.distanceGoals === 'Ultra') && shoe.cushion === 'Plush') score += 1;
                if (gait.distanceGoals === 'Daily' && shoe.cushion === 'Balanced') score += 1;

                // ── Experience level ──────────────────────────────────────────
                if (gait.experienceLevel === 'Beginner' && shoe.price <= 130) score += 1;
                if ((gait.experienceLevel === 'Elite' || gait.experienceLevel === 'Advanced') && shoe.isStaffPick) score += 1;

                // ── Injury signals ────────────────────────────────────────────
                const injuries = gait.injuryHistory || [];
                if (injuries.includes('Shin') && shoe.cushion === 'Plush') score += 1;
                if (injuries.includes('Plantar') && shoe.drop >= 8) score += 1;
                if (injuries.includes('Knee') && shoe.cushion !== 'Firm') score += 1;
                if (injuries.includes('Achilles') && shoe.drop <= 6) score -= 1; // low drop aggravates Achilles
                if (injuries.includes('Hip') && shoe.support === 'Stability') score += 1;
                if (injuries.includes('ITBand') && shoe.cushion === 'Plush') score += 1;
                if (injuries.includes('Back') && shoe.cushion === 'Plush') score += 1;

                // Require at least 3 points to surface as a match
                return score >= 3;
            });
        }


        // 2. Category filter (works independently AND within My Matches)
        if (activeFilters.category !== 'All') {
            filtered = filtered.filter(s => s.category === activeFilters.category);
        }

        // 3. Gender filter
        if (activeFilters.gender !== 'All') {
            filtered = filtered.filter(s => s.gender === activeFilters.gender || s.gender === 'Unisex');
        }

        // 4. Brand filter
        if (activeFilters.brands.length > 0) {
            filtered = filtered.filter(s => activeFilters.brands.includes(s.brand));
        }

        // 5. Support filter
        if (activeFilters.support !== 'All') {
            filtered = filtered.filter(s => s.support === activeFilters.support);
        }

        // 6. Cushion filter
        if (activeFilters.cushion !== 'All') {
            filtered = filtered.filter(s => s.cushion === activeFilters.cushion);
        }

        return filtered;
    }, [activeFilters, profile.isGuest]);

    const toggleBrand = (brand: Brand) => {
        setActiveFilters(prev => ({
            ...prev,
            brands: prev.brands.includes(brand)
                ? prev.brands.filter(b => b !== brand)
                : [...prev.brands, brand]
        }));
    };

    // Count active non-matchMode filters (for the badge on the Filters button)
    const activeFilterCount = [
        activeFilters.gender !== 'All' ? 1 : 0,
        activeFilters.brands.length > 0 ? 1 : 0,
        activeFilters.support !== 'All' ? 1 : 0,
        activeFilters.cushion !== 'All' ? 1 : 0,
        activeFilters.category !== 'All' ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const FilterDrawer = (
        <div className="fixed inset-0 z-[5000] flex justify-end items-center pr-3 pointer-events-auto" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <div className={`bg-[${THEME.surface}] w-[22rem] relative z-10 flex flex-col border border-white/10 rounded-[28px] shadow-2xl animate-in slide-in-from-right duration-300`}
                style={{ maxHeight: 'calc(100% - 1rem)' }}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Filters</h2>
                        {activeFilters.matchMode && (
                            <p className={`text-xs text-[${THEME.accent}] mt-0.5 font-semibold`}>Within My Matches</p>
                        )}
                    </div>
                    <button onClick={() => setShowFilters(false)}><X className={`text-[${THEME.muted}]`} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Category */}
                    <div>
                        <h3 className={`text-xs font-bold text-[${THEME.muted}] uppercase mb-3`}>
                            Category {activeFilters.matchMode && <span className={`text-[${THEME.accent}]`}>· within matches</span>}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['All', 'Road', 'Trail', 'Track', 'Hybrid'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFilters(prev => ({ ...prev, category: cat }))}
                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${activeFilters.category === cat ? 'bg-white text-black' : `bg-black/40 text-[${THEME.muted}]`}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <h3 className={`text-xs font-bold text-[${THEME.muted}] uppercase mb-3`}>Gender</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {(['All', 'Men', 'Women'] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setActiveFilters(prev => ({ ...prev, gender: g }))}
                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${activeFilters.gender === g ? `bg-[${THEME.accent}] text-white` : `bg-black/40 text-[${THEME.muted}]`}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Brands */}
                    <div>
                        <h3 className={`text-xs font-bold text-[${THEME.muted}] uppercase mb-3`}>Brand</h3>
                        <div className="space-y-1">
                            {ALL_BRANDS.map(brand => (
                                <label key={brand} className={`flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors`}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${activeFilters.brands.includes(brand) ? `bg-[${THEME.accent}] border-[${THEME.accent}]` : 'border-white/20'}`}>
                                        {activeFilters.brands.includes(brand) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={activeFilters.brands.includes(brand)} onChange={() => toggleBrand(brand)} />
                                    <span className="text-sm text-white">{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className={`text-xs font-bold text-[${THEME.muted}] uppercase mb-3`}>Support Type</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['All', 'Neutral', 'Stability'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveFilters(prev => ({ ...prev, support: s }))}
                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${activeFilters.support === s ? `bg-[${THEME.accent}] text-white` : `bg-black/40 text-[${THEME.muted}]`}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cushion */}
                    <div>
                        <h3 className={`text-xs font-bold text-[${THEME.muted}] uppercase mb-3`}>Cushion Level</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['All', 'Firm', 'Balanced', 'Plush'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setActiveFilters(prev => ({ ...prev, cushion: c }))}
                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${activeFilters.cushion === c ? `bg-[${THEME.accent}] text-white` : `bg-black/40 text-[${THEME.muted}]`}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="p-5 border-t border-white/5 space-y-3">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => setActiveFilters(prev => ({
                                ...DEFAULT_FILTERS,
                                matchMode: prev.matchMode  // preserve match mode when clearing other filters
                            }))}
                            className={`w-full text-sm text-[${THEME.muted}] hover:text-white transition-colors text-center`}
                        >
                            Clear filters ({activeFilterCount})
                        </button>
                    )}
                    <Button fullWidth onClick={() => setShowFilters(false)}>
                        Show {displayedInventory.length} Results
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-0 relative pb-4">
            {/* Sticky Top bar — only the pills are visible, no background */}
            <div className="sticky top-0 z-20 pb-3 pt-1">
                <div className="flex gap-2 items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {!profile.isGuest && (
                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, matchMode: !prev.matchMode }))}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilters.matchMode
                                    ? `bg-gradient-to-r from-[${THEME.text}] to-[${THEME.accent}] text-black`
                                    : `bg-[${THEME.surface}] text-[${THEME.muted}]`}`}
                            >
                                My Matches
                            </button>
                        )}
                        {/* Active category chip */}
                        {activeFilters.category !== 'All' && (
                            <span className={`flex items-center gap-1 text-xs bg-white/10 text-white px-3 py-1.5 rounded-full font-semibold`}>
                                {activeFilters.category}
                                <button onClick={() => setActiveFilters(prev => ({ ...prev, category: 'All' }))}><X size={11} /></button>
                            </span>
                        )}
                    </div>
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setShowFilters(true)}
                            className={`flex items-center gap-2 px-4 py-2 bg-[${THEME.surface}] rounded-full border border-white/10 text-white text-sm font-semibold`}
                        >
                            <Filter size={15} />
                            Filters
                        </button>
                        {activeFilterCount > 0 && (
                            <span className={`absolute -top-1 -right-1 w-4 h-4 bg-[${THEME.accent}] rounded-full text-white text-[10px] font-bold flex items-center justify-center`}>
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Active filter chips row */}
            {(activeFilters.gender !== 'All' || activeFilters.support !== 'All' || activeFilters.cushion !== 'All' || activeFilters.brands.length > 0) && (
                <div className="flex flex-wrap gap-2 -mt-2">
                    {activeFilters.gender !== 'All' && (
                        <span className={`flex items-center gap-1 text-xs bg-white/10 text-white px-3 py-1 rounded-full`}>
                            {activeFilters.gender}
                            <button onClick={() => setActiveFilters(prev => ({ ...prev, gender: 'All' }))}><X size={12} /></button>
                        </span>
                    )}
                    {activeFilters.support !== 'All' && (
                        <span className={`flex items-center gap-1 text-xs bg-[${THEME.accent}]/20 text-[${THEME.accent}] px-3 py-1 rounded-full`}>
                            {activeFilters.support}
                            <button onClick={() => setActiveFilters(prev => ({ ...prev, support: 'All' }))}><X size={12} /></button>
                        </span>
                    )}
                    {activeFilters.cushion !== 'All' && (
                        <span className={`flex items-center gap-1 text-xs bg-[${THEME.accent}]/20 text-[${THEME.accent}] px-3 py-1 rounded-full`}>
                            {activeFilters.cushion}
                            <button onClick={() => setActiveFilters(prev => ({ ...prev, cushion: 'All' }))}><X size={12} /></button>
                        </span>
                    )}
                    {activeFilters.brands.map(b => (
                        <span key={b} className={`flex items-center gap-1 text-xs bg-[${THEME.accent}]/20 text-[${THEME.accent}] px-3 py-1 rounded-full`}>
                            {b}
                            <button onClick={() => toggleBrand(b)}><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-4">
                {displayedInventory.map(shoe => (
                    <div
                        key={shoe.id}
                        className="group relative flex flex-col cursor-pointer"
                        onClick={() => onProductClick(shoe)}
                    >
                        <div className="aspect-square rounded-[24px] bg-black overflow-hidden mb-3 relative">
                            <img
                                src={shoe.image}
                                alt={shoe.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover object-center scale-110 group-hover:scale-125 transition-transform duration-500"
                            />
                            {/* Radial vignette blends edges into black bg */}
                            <div className="absolute inset-0 rounded-[24px]"
                                style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)' }}
                            />
                            {shoe.isStaffPick && (
                                <div className="absolute top-2 left-2">
                                    <Badge color={`bg-[${THEME.accent}]`}>Staff Pick</Badge>
                                </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                <Plus size={16} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <div className={`text-xs text-[${THEME.muted}] mb-1`}>{shoe.brand}</div>
                            <h3 className="font-bold text-white leading-tight mb-2">{shoe.name}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-sm font-medium text-white">${shoe.price}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[shoe.category] || 'bg-white/10 text-white'}`}>
                                    {shoe.category}
                                </span>
                                {/* Gender chip */}
                                <span className={`text-[10px] text-[${THEME.muted}] border border-white/10 px-1 rounded`}>
                                    {shoe.gender}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {displayedInventory.length === 0 && (
                <div className={`text-center py-12 text-[${THEME.muted}]`}>
                    <p className="mb-2">No shoes match these filters.</p>
                    <Button variant="ghost" className="mt-2" onClick={() => setActiveFilters(prev => ({ ...DEFAULT_FILTERS, matchMode: prev.matchMode }))}>
                        Clear Filters
                    </Button>
                </div>
            )}

            {showFilters && createPortal(FilterDrawer, document.body)}
        </div>
    );
};