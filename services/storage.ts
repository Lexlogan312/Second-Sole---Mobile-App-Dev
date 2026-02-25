import { UserProfile, CartItem, LocalStorageSchema, GaitProfile, ShoeRotationItem, Account } from '../types';

const STORAGE_KEY = 'second_sole_v2_data';

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultAccount = (overrides?: Partial<UserProfile>): Account => ({
  profile: {
    name: '',
    email: '',
    isGuest: false,
    attendanceCount: 0,
    milesRun: 0,
    ...overrides,
  },
  passwordHash: '',
  gaitProfile: {},
  rotation: [],
  cart: [],
  rsvpedEvents: [],
  privacyAudit: { lastWipe: null, storageUsed: '0KB' },
});

const getDefaultSchema = (): LocalStorageSchema => ({
  accounts: {},
  currentAccountId: null,
  isAuthenticated: false,
});

// ─── Raw storage helpers ──────────────────────────────────────────────────────

const getSchema = (): LocalStorageSchema => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSchema();
    const parsed = JSON.parse(raw);
    return { ...getDefaultSchema(), ...parsed };
  } catch (e) {
    console.error('Storage Error', e);
    return getDefaultSchema();
  }
};

const setSchema = (data: LocalStorageSchema) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// ─── Current account helpers ──────────────────────────────────────────────────

const getCurrentAccountData = (): Account | null => {
  const schema = getSchema();
  if (!schema.currentAccountId) return null;
  return schema.accounts[schema.currentAccountId] ?? null;
};

const saveCurrentAccountData = (account: Account) => {
  const schema = getSchema();
  if (!schema.currentAccountId) return;
  // Recalculate storage used
  const jsonString = JSON.stringify({ ...schema, accounts: { ...schema.accounts, [schema.currentAccountId]: account } });
  const bytes = new Blob([jsonString]).size;
  account.privacyAudit.storageUsed = `${(bytes / 1024).toFixed(2)}KB`;
  schema.accounts[schema.currentAccountId] = account;
  setSchema(schema);
};

// ─── Public service ───────────────────────────────────────────────────────────

export const storageService = {

  // ── Account management ──────────────────────────────────────────────────────

  getAccounts: (): Array<{ id: string; name: string; email: string; isGuest: boolean }> => {
    const schema = getSchema();
    return Object.entries(schema.accounts).map(([id, acc]) => ({
      id,
      name: acc.profile.name,
      email: acc.profile.email,
      isGuest: acc.profile.isGuest,
    }));
  },

  createAccount: (name: string, email: string, passwordHash: string): string => {
    const schema = getSchema();
    const id = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    schema.accounts[id] = {
      ...defaultAccount({ name, email, isGuest: false }),
      passwordHash,
    };
    schema.currentAccountId = id;
    schema.isAuthenticated = true;
    setSchema(schema);
    return id;
  },

  createGuestAccount: (): string => {
    const schema = getSchema();
    // Reuse existing guest account if present
    const existing = Object.entries(schema.accounts).find(([, acc]) => acc.profile.isGuest);
    if (existing) {
      schema.currentAccountId = existing[0];
      schema.isAuthenticated = true;
      setSchema(schema);
      return existing[0];
    }
    const id = `guest_${Date.now()}`;
    schema.accounts[id] = {
      ...defaultAccount({ name: 'Guest Runner', email: '', isGuest: true }),
      passwordHash: '',
    };
    schema.currentAccountId = id;
    schema.isAuthenticated = true;
    setSchema(schema);
    return id;
  },

  switchAccount: (id: string) => {
    const schema = getSchema();
    if (!schema.accounts[id]) return;
    schema.currentAccountId = id;
    schema.isAuthenticated = false; // require re-auth on switch
    setSchema(schema);
  },

  deleteAccount: (id: string) => {
    const schema = getSchema();
    delete schema.accounts[id];
    if (schema.currentAccountId === id) {
      schema.currentAccountId = Object.keys(schema.accounts)[0] ?? null;
      schema.isAuthenticated = false;
    }
    setSchema(schema);
  },

  verifyPassword: (id: string, hash: string): boolean => {
    const schema = getSchema();
    return schema.accounts[id]?.passwordHash === hash;
  },

  getCurrentAccountId: (): string | null => getSchema().currentAccountId,

  // ── Auth ────────────────────────────────────────────────────────────────────

  isAuthenticated: () => getSchema().isAuthenticated,

  setAuthenticated: (status: boolean) => {
    const schema = getSchema();
    schema.isAuthenticated = status;
    setSchema(schema);
  },

  logout: () => {
    const schema = getSchema();
    schema.isAuthenticated = false;
    setSchema(schema);
  },

  // ── Profile ─────────────────────────────────────────────────────────────────

  getProfile: (): UserProfile => {
    const acc = getCurrentAccountData();
    return acc?.profile ?? defaultAccount().profile;
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.profile = { ...acc.profile, ...updates };
    saveCurrentAccountData(acc);
    return acc.profile;
  },

  // ── Gait profile ─────────────────────────────────────────────────────────────

  getGaitProfile: (): GaitProfile => getCurrentAccountData()?.gaitProfile ?? {},

  updateGaitProfile: (updates: Partial<GaitProfile>) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.gaitProfile = { ...acc.gaitProfile, ...updates };
    saveCurrentAccountData(acc);
  },

  // ── Rotation ─────────────────────────────────────────────────────────────────

  getRotation: (): ShoeRotationItem[] => getCurrentAccountData()?.rotation ?? [],

  addToRotation: (shoe: ShoeRotationItem) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.rotation.push(shoe);
    saveCurrentAccountData(acc);
  },

  updateRotationShoe: (id: string, milesToAdd: number) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    const shoe = acc.rotation.find(s => s.id === id);
    if (shoe) { shoe.miles += milesToAdd; saveCurrentAccountData(acc); }
  },

  removeRotationShoe: (id: string) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.rotation = acc.rotation.filter(s => s.id !== id);
    saveCurrentAccountData(acc);
  },

  // ── Cart ─────────────────────────────────────────────────────────────────────

  getCart: (): CartItem[] => getCurrentAccountData()?.cart ?? [],

  addToCart: (item: CartItem) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    const existingIndex = acc.cart.findIndex(i => i.shoeId === item.shoeId && i.size === item.size);
    if (existingIndex > -1) acc.cart[existingIndex].quantity += item.quantity;
    else acc.cart.push(item);
    saveCurrentAccountData(acc);
  },

  removeFromCart: (shoeId: string, size: number) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.cart = acc.cart.filter(i => !(i.shoeId === shoeId && i.size === size));
    saveCurrentAccountData(acc);
  },

  clearCart: () => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.cart = [];
    saveCurrentAccountData(acc);
  },

  // ── RSVPs ─────────────────────────────────────────────────────────────────────

  getRsvpedEvents: (): string[] => getCurrentAccountData()?.rsvpedEvents ?? [],

  rsvpEvent: (eventId?: string) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.profile.attendanceCount = (acc.profile.attendanceCount || 0) + 1;
    if (eventId && !acc.rsvpedEvents?.includes(eventId)) {
      acc.rsvpedEvents = [...(acc.rsvpedEvents ?? []), eventId];
    }
    saveCurrentAccountData(acc);
  },

  removeRsvp: (eventId: string) => {
    const acc = getCurrentAccountData();
    if (!acc) return;
    acc.rsvpedEvents = (acc.rsvpedEvents ?? []).filter(id => id !== eventId);
    saveCurrentAccountData(acc);
  },

  // ── Privacy audit ─────────────────────────────────────────────────────────────

  getPrivacyAudit: () => getCurrentAccountData()?.privacyAudit ?? { lastWipe: null, storageUsed: '0KB' },

  // ── Data wipe (current account only) ─────────────────────────────────────────

  wipeData: () => {
    const schema = getSchema();
    if (schema.currentAccountId) {
      delete schema.accounts[schema.currentAccountId];
      schema.currentAccountId = null;
      schema.isAuthenticated = false;
      setSchema(schema);
    }
    window.location.reload();
  },

  // ── Wipe all accounts ─────────────────────────────────────────────────────────

  wipeAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  },

  getRawData: () => getSchema(),
};