export type ShoeCategory = 'Road' | 'Trail' | 'Track' | 'Hybrid';
export type SupportType = 'Neutral' | 'Stability';
export type CushionLevel = 'Firm' | 'Balanced' | 'Plush';
export type Gender = 'Men' | 'Women' | 'Unisex';
export type Brand =
  | 'Saucony'
  | 'Brooks'
  | 'Hoka'
  | 'New Balance'
  | 'Nike'
  | 'Altra'
  | 'ASICS'
  | 'ON Running'
  | 'Adidas'
  | 'Puma'
  | 'Mizuno'
  | 'Under Armour'
  | 'Salomon'
  | 'Skechers';

// Shoe type used by the Sole Tracker for dynamic mileage limits
export type ShoeType = 'Daily Trainer' | 'Racer' | 'Trail' | 'Racing Flat' | 'Other';

// Terrain type used for run logging — extended beyond Road/Trail
export type TerrainType = 'Road' | 'Trail' | 'Track' | 'Treadmill' | 'Mixed';

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
  gender: Gender;
  tags?: string[];
  staffTake?: string;
}

export interface CartItem {
  shoeId: string;
  quantity: number;
  size: number;
  addedAt?: number; // timestamp for abandoned cart detection
}

export interface GaitProfile {
  terrain?: string;         // 'Road' | 'Trail' | 'Track' | 'Hybrid'
  gender?: string;          // 'Men' | 'Women' | 'Unisex'
  experienceLevel?: string; // 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'
  strike?: string;          // 'Heel' | 'Midfoot' | 'Forefoot'
  arch?: string;            // 'Low' | 'Medium' | 'High'
  pronation?: string;       // 'Neutral' | 'Over' | 'Under'
  weeklyMiles?: string;     // 'Low' | 'Medium' | 'High'
  distanceGoals?: string;   // 'Speed' | 'Daily' | 'Long' | 'Ultra'
  cushionPref?: string;     // 'Firm' | 'Balanced' | 'Plush'
  dropPref?: string;        // 'Zero' | 'Low' | 'Medium' | 'High'
  footShape?: string;       // 'Standard' | 'Wide'
  injuryHistory?: string[]; // 'None' | 'Plantar' | 'Shin' | 'Knee' | 'ITBand' | 'Hip' | 'Back' | 'Achilles'
  completedAt?: number;     // timestamp of quiz completion
}

// Individual run logged against a tracked shoe
export interface RunLog {
  id: string;
  date: string;        // ISO date string 'YYYY-MM-DD'
  miles: number;
  terrain: TerrainType;
  notes?: string;
}

export interface ShoeRotationItem {
  id: string; // unique instance id
  shoeId: string; // reference to inventory id if applicable, or generic
  name: string;
  nickname?: string;
  miles: number;
  threshold: number;
  image?: string;
  shoeType?: ShoeType;   // for dynamic mileage limits
  runLogs?: RunLog[];    // individual run history
  retiredAt?: string;    // ISO date — set when retired
  isRetired?: boolean;
}

// Purchase history
export interface OrderItem {
  shoeId: string;
  shoeName: string;
  brand: string;
  size: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;           // ISO date string
  fulfillmentType: 'Pickup' | 'Shipping';
  items: OrderItem[];
  total: number;
}

// Notification preferences
export interface NotificationPrefs {
  cartReminders: boolean;
  mileageAlerts: boolean;
  runLogCongrats: boolean;
  eventReminders: boolean;
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

export interface Account {
  profile: UserProfile;
  passwordHash: string;  // empty string for guest accounts
  gaitProfile: GaitProfile;
  rotation: ShoeRotationItem[];
  cart: CartItem[];
  rsvpedEvents: string[];
  privacyAudit: PrivacyAudit;
  orders?: Order[];
  notificationPrefs?: NotificationPrefs;
  retiredShoes?: ShoeRotationItem[];
  customInventory?: Shoe[];        // Dev-mode added shoes
  customTrails?: Trail[];          // Dev-mode added trails
  customEvents?: Event[];          // Dev-mode added events
  devModeEnabled?: boolean;
}

export interface LocalStorageSchema {
  accounts: Record<string, Account>;
  currentAccountId: string | null;
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
  photo?: string;
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