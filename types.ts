export type ShoeCategory = 'Road' | 'Trail' | 'Track' | 'Hybrid';
export type SupportType = 'Neutral' | 'Stability';
export type CushionLevel = 'Firm' | 'Balanced' | 'Plush';
export type Brand = 'Saucony' | 'Brooks' | 'Hoka' | 'New Balance' | 'Nike' | 'Altra';

export interface Shoe {
  id: string;
  name: string;
  brand: Brand;
  price: number;
  category: ShoeCategory;
  support: SupportType;
  cushion: CushionLevel;
  drop: number; // mm
  weight: number; // oz
  image: string;
  isStaffPick?: boolean;
  description: string;
  staffComparison?: string;
}

export interface CartItem {
  shoeId: string;
  quantity: number;
  size: number;
}

export interface GaitProfile {
  terrain?: string;
  strike?: string;
  arch?: string;
  pronation?: string;
  distanceGoals?: string;
  cushionPref?: string;
  footShape?: string;
  injuryHistory?: string[];
}

export interface ShoeRotationItem {
  id: string; // unique instance id
  shoeId: string; // reference to inventory id if applicable, or generic
  name: string;
  nickname?: string;
  miles: number;
  threshold: number;
  image?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  isGuest: boolean;
  attendanceCount: number;
  milesRun?: number;
}

export interface PrivacyAudit {
  lastWipe: string | null;
  storageUsed: string;
}

export interface LocalStorageSchema {
  profile: UserProfile;
  gaitProfile: GaitProfile;
  rotation: ShoeRotationItem[];
  cart: CartItem[];
  privacyAudit: PrivacyAudit;
  isAuthenticated: boolean;
}

export interface Trail {
  id: string;
  name: string;
  distance: string;
  surface: string;
  description: string;
  status: 'Open' | 'Muddy' | 'Closed';
  highlights: string[];
  parkingInfo: string;
  coordinates?: { lat: number; lng: number };
}

export interface Event {
  id: string;
  name: string;
  day: string;
  time: string;
  description: string;
  paceGroups: string[];
}