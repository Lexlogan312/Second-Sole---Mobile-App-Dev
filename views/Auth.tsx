import React, { useState, useEffect, useCallback } from 'react';
import { ScanFace, Fingerprint, Lock, ChevronRight, UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button, Input } from '../components/UI';
import { storageService } from '../services/storage';
import { authenticate, checkBiometricAvailability, getBiometryLabel } from '../services/biometric';
import { BiometryType } from '@aparajita/capacitor-biometric-auth';
import { THEME } from '../theme';

interface AuthProps {
  onAuthenticated: () => void;
}

type AuthScreen = 'welcome' | 'add-account' | 'biometric-lock';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [screen, setScreen] = useState<AuthScreen>('welcome');
  const [accounts, setAccounts] = useState(storageService.getAccounts());

  // Inline form state (on the welcome screen)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Show password fields once the user starts typing in name or email
  const showPasswordFields = name.trim().length > 0 || email.trim().length > 0;

  // Password fallback on lock screen
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [showFallbackPw, setShowFallbackPw] = useState(false);

  // Biometric
  const [isScanning, setIsScanning] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>(BiometryType.none);
  const [biometricError, setBiometricError] = useState('');

  useEffect(() => {
    checkBiometricAvailability().then(({ biometryType }) => setBiometryType(biometryType));
  }, []);

  const triggerBiometric = useCallback(async () => {
    setIsScanning(true);
    setBiometricError('');
    const result = await authenticate('Unlock your Second Sole profile');
    setIsScanning(false);
    if (result.success) {
      storageService.setAuthenticated(true);
      onAuthenticated();
    } else {
      setBiometricError(result.error ?? 'Authentication failed');
    }
  }, [onAuthenticated]);

  useEffect(() => {
    if (screen === 'biometric-lock') triggerBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const handleCreateAccount = async () => {
    setFormError('');
    if (!name.trim()) return setFormError('Please enter your name.');
    if (!email.trim() || !email.includes('@')) return setFormError('Please enter a valid email.');
    if (password.length < 6) return setFormError('Password must be at least 6 characters.');
    if (password !== confirm) return setFormError('Passwords do not match.');
    const existing = storageService.getAccounts().find(a => a.email.toLowerCase() === email.toLowerCase());
    if (existing) return setFormError('An account with that email already exists.');

    setIsCreating(true);
    const hash = await hashPassword(password);
    storageService.createAccount(name.trim(), email.trim().toLowerCase(), hash);
    setIsCreating(false);
    setAccounts(storageService.getAccounts());
    setScreen('biometric-lock');
  };

  // ── Welcome / Account List ────────────────────────────────────────────────────
  if (screen === 'welcome') {
    const namedAccounts = accounts.filter(a => !a.isGuest);

    return (
      <div className={`min-h-screen bg-[${THEME.bg}] flex flex-col p-6 relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[${THEME.surface}] to-transparent opacity-60 -z-10`} />

        {/* Logo */}
        <div className="pt-16 pb-10">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Second Sole<br />
            <span className="gradient-text">Medina</span>
          </h1>
          <p className={`text-sm text-[${THEME.muted}] mt-2`}>
            Precision fit. Local expertise. Digital speed.
          </p>
        </div>

        <div className="flex-1 flex flex-col">
          {namedAccounts.length > 0 ? (
            // ── Existing accounts list ──
            <>
              <p className={`text-xs font-semibold uppercase tracking-widest text-[${THEME.muted}] mb-4`}>
                Your Accounts
              </p>
              <div className="space-y-3 mb-6">
                {namedAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      storageService.switchAccount(acc.id);
                      setScreen('biometric-lock');
                    }}
                    className={`w-full flex items-center gap-4 bg-[${THEME.surface}] border border-white/10 rounded-2xl p-4 text-left hover:border-[${THEME.accent}]/50 active:scale-[0.98] transition-all`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[${THEME.text}] to-[${THEME.accent}] flex items-center justify-center text-black font-bold text-xl flex-shrink-0 shadow-[0_0_20px_rgba(228,57,40,0.25)]`}>
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{acc.name}</p>
                      <p className={`text-xs text-[${THEME.muted}] truncate mt-0.5`}>{acc.email}</p>
                    </div>
                    <Lock size={15} className={`text-[${THEME.muted}] flex-shrink-0`} />
                  </button>
                ))}
              </div>

              {/* Add account row */}
              <button
                onClick={() => { setName(''); setEmail(''); setPassword(''); setConfirm(''); setFormError(''); setScreen('add-account'); }}
                className={`w-full flex items-center gap-4 border border-dashed border-white/15 rounded-2xl p-4 text-left hover:border-white/30 transition-colors mb-4`}
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={18} className={`text-[${THEME.muted}]`} />
                </div>
                <p className={`text-sm text-[${THEME.muted}]`}>Add account</p>
              </button>
            </>
          ) : (
            // ── No accounts — inline create form ──
            <>
              <div className="space-y-3 mb-4">
                <Input
                  placeholder="First & Last Name"
                  value={name}
                  onChange={e => { setName(e.target.value); setFormError(''); }}
                />
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFormError(''); }}
                />
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{ maxHeight: showPasswordFields ? '220px' : '0px', opacity: showPasswordFields ? 1 : 0 }}
                >
                  <div className="space-y-3 pt-1">
                    <div className="relative">
                      <Input
                        placeholder="Password (min 6 chars)"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setFormError(''); }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-[${THEME.muted}]`}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Input
                      placeholder="Confirm Password"
                      type="password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setFormError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateAccount(); }}
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={14} className="flex-shrink-0" />{formError}
                </div>
              )}

              <Button fullWidth onClick={handleCreateAccount}
                disabled={isCreating || !name || !email || !password || !confirm} className="mb-4">
                {isCreating ? 'Creating...' : 'Create Account'}
                <ChevronRight size={18} className="ml-auto" />
              </Button>
            </>
          )}
        </div>

        {/* Guest + legal */}
        <div className="pb-8">
          <button
            onClick={() => { storageService.createGuestAccount(); onAuthenticated(); }}
            className={`w-full text-center text-sm text-[${THEME.muted}] hover:text-white transition-colors py-3`}
          >
            Continue as Guest →
          </button>
          <p className={`text-xs text-center text-[${THEME.muted}]/40 mt-1`}>
            All data stored locally on device. No cloud transmission.
          </p>
        </div>
      </div>
    );
  }

  // ── Add Account (separate screen) ─────────────────────────────────────────────
  if (screen === 'add-account') {
    return (
      <div className={`min-h-screen bg-[${THEME.bg}] flex flex-col p-6 relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[${THEME.surface}] to-transparent opacity-60 -z-10`} />

        {/* Back */}
        <div className="pt-14 pb-2">
          <button
            onClick={() => { setScreen('welcome'); setFormError(''); }}
            className={`flex items-center gap-1 text-sm text-[${THEME.muted}] hover:text-white transition-colors`}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="pt-8 pb-10">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Add<br /><span className="gradient-text">Account</span>
          </h1>
          <p className={`text-sm text-[${THEME.muted}] mt-2`}>Stored securely on this device only.</p>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="space-y-3 mb-4">
            <Input
              placeholder="First & Last Name"
              value={name}
              onChange={e => { setName(e.target.value); setFormError(''); }}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setFormError(''); }}
            />
            <div
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{ maxHeight: showPasswordFields ? '220px' : '0px', opacity: showPasswordFields ? 1 : 0 }}
            >
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <Input
                    placeholder="Password (min 6 chars)"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFormError(''); }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-[${THEME.muted}]`}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input
                  placeholder="Confirm Password"
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setFormError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateAccount(); }}
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={14} className="flex-shrink-0" />{formError}
            </div>
          )}
        </div>

        <div className="pb-8">
          <Button fullWidth onClick={handleCreateAccount}
            disabled={isCreating || !name || !email || !password || !confirm} className="mb-4">
            {isCreating ? 'Creating...' : 'Add Account'}
            <ChevronRight size={18} className="ml-auto" />
          </Button>
          <p className={`text-xs text-center text-[${THEME.muted}]/40`}>
            All data stored locally on device. No cloud transmission.
          </p>
        </div>
      </div>
    );
  }

  // ── Biometric Lock Screen ─────────────────────────────────────────────────────
  if (screen === 'biometric-lock') {
    const profile = storageService.getProfile();
    const biometryLabel = getBiometryLabel(biometryType);
    const isFaceId = biometryType === BiometryType.faceId;

    const handlePasswordFallback = async () => {
      setPasswordError('');
      const accountId = storageService.getCurrentAccountId();
      if (!accountId) return;
      const hash = await hashPassword(passwordInput);
      if (storageService.verifyPassword(accountId, hash)) {
        storageService.setAuthenticated(true);
        onAuthenticated();
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    };

    return (
      <div className={`min-h-screen bg-[${THEME.bg}] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[${THEME.surface}] to-transparent opacity-60 -z-10`} />

        <button
          onClick={() => {
            setScreen('welcome');
            setShowPasswordFallback(false);
            setPasswordInput('');
            setPasswordError('');
          }}
          className={`absolute top-14 left-6 flex items-center gap-1 text-sm text-[${THEME.muted}] hover:text-white transition-colors`}
        >
          <ArrowLeft size={16} /> Accounts
        </button>

        {!showPasswordFallback ? (
          <>
            {/* Biometric ring */}
            <div className="mb-10 relative">
              <div
                onClick={triggerBiometric}
                className={`w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-700 cursor-pointer ${isScanning
                  ? `border-[${THEME.accent}] shadow-[0_0_60px_rgba(228,57,40,0.45)]`
                  : 'border-white/15 hover:border-white/30'
                  }`}
              >
                {isFaceId
                  ? <ScanFace size={56} className={isScanning ? `text-[${THEME.accent}] animate-pulse` : 'text-white'} />
                  : <Fingerprint size={56} className={isScanning ? `text-[${THEME.accent}] animate-pulse` : 'text-white'} />
                }
              </div>
              {isScanning && (
                <div className="absolute inset-0 rounded-full border-t-2 border-white/50 animate-spin pointer-events-none" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {profile.name || 'Runner'}</h2>
            <p className={`text-[${THEME.muted}] mb-10`}>
              {isScanning ? 'Verifying...' : `Tap to use ${biometryLabel}`}
            </p>

            {biometricError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3 w-full max-w-xs mb-6">
                <AlertCircle size={14} className="flex-shrink-0" />
                {biometricError}
              </div>
            )}

            <Button size="lg" className="w-52 mb-5" onClick={triggerBiometric} disabled={isScanning}>
              {isScanning ? 'Verifying...' : `Use ${biometryLabel}`}
            </Button>

            <button
              onClick={() => { setShowPasswordFallback(true); setBiometricError(''); }}
              className={`text-sm text-[${THEME.muted}] hover:text-white transition-colors`}
            >
              Use password instead
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full border border-white/15 flex items-center justify-center mb-8">
              <Lock size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Enter Password</h2>
            <p className={`text-sm text-[${THEME.muted}] mb-8`}>{profile.email || profile.name}</p>

            <div className="w-full max-w-xs">
              <div className="relative mb-4">
                <Input
                  placeholder="Password"
                  type={showFallbackPw ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handlePasswordFallback(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowFallbackPw(v => !v)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 text-[${THEME.muted}]`}
                >
                  {showFallbackPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={14} className="flex-shrink-0" />{passwordError}
                </div>
              )}

              <Button fullWidth onClick={handlePasswordFallback} disabled={!passwordInput} className="mb-3">
                Unlock <ChevronRight size={16} className="ml-2" />
              </Button>

              <button
                onClick={() => { setShowPasswordFallback(false); setPasswordInput(''); setPasswordError(''); }}
                className={`w-full text-sm text-[${THEME.muted}] hover:text-white transition-colors py-2`}
              >
                ← Back to {biometryLabel}
              </button>
            </div>
          </>
        )}

        <div className={`absolute bottom-10 flex items-center gap-2 text-xs text-[${THEME.muted}]/60`}>
          <Lock size={11} />
          <span>Local Encrypted Vault</span>
        </div>
      </div>
    );
  }

  return null;
};