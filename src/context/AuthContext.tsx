import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UmkmProfile, MentorProfile, UserRole } from '../types/index.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user_profile',
  UMKM: 'auth_umkm_profile',
  MENTOR: 'auth_mentor_profile',
  LAST_TAB: 'banua_active_tab',
};

function getStoredJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: UserProfile | null;
  umkm: UmkmProfile | null;
  mentor: MentorProfile | null;
  role: UserRole;
  token: string | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string; isInvited?: boolean; inviteToken?: string }>;
  registerUmkm: (data: { fullName: string; businessName: string; email: string; whatsapp?: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; resetUrl?: string; resetToken?: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyInvite: (token: string) => Promise<{ valid: boolean; email?: string; fullName?: string; institution?: string; error?: string }>;
  acceptInvite: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshProfile: (silent?: boolean) => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously restore state from localStorage on first boot so there is ZERO screen flicker to Landing Page
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;
  });
  const [user, setUser] = useState<UserProfile | null>(() => getStoredJson<UserProfile>(STORAGE_KEYS.USER));
  const [umkm, setUmkm] = useState<UmkmProfile | null>(() => getStoredJson<UmkmProfile>(STORAGE_KEYS.UMKM));
  const [mentor, setMentor] = useState<MentorProfile | null>(() => getStoredJson<MentorProfile>(STORAGE_KEYS.MENTOR));

  // If token exists but user object is not yet populated, set loading = true to await first validation
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    return Boolean(savedToken && !savedUser);
  });

  // Helper to persist auth data consistently across localStorage and state
  const persistSession = useCallback((
    newToken: string | null,
    newUser: UserProfile | null,
    newUmkm: UmkmProfile | null,
    newMentor: MentorProfile | null
  ) => {
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
      }

      if (newUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }

      if (newUmkm) {
        localStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(newUmkm));
      } else {
        localStorage.removeItem(STORAGE_KEYS.UMKM);
      }

      if (newMentor) {
        localStorage.setItem(STORAGE_KEYS.MENTOR, JSON.stringify(newMentor));
      } else {
        localStorage.removeItem(STORAGE_KEYS.MENTOR);
      }
    }

    setToken(newToken);
    setUser(newUser);
    setUmkm(newUmkm);
    setMentor(newMentor);
  }, []);

  // Helper authenticated fetch with active token
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null);
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
  }, [token]);

  // Refresh profile from server (with retries for connection resilience)
  const refreshProfile = useCallback(async (silent = true) => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null);
    if (!currentToken) {
      persistSession(null, null, null, null);
      setLoading(false);
      return;
    }

    if (!silent && !user) {
      setLoading(true);
    }

    try {
      let res: Response | null = null;
      // Retry up to 3 times in case the backend server is warming up
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          });
          if (res) break;
        } catch (err) {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
          }
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        persistSession(currentToken, data.profile, data.umkm, data.mentor);
      } else if (res && (res.status === 401 || res.status === 403)) {
        // Explicit invalidation by server (token revoked or user deactivated)
        console.warn('Sesi login telah kedaluwarsa atau akun dinonaktifkan.');
        persistSession(null, null, null, null);
      } else {
        // Network issue or 5xx: DO NOT boot the user out! Keep local cached session
        console.warn('Tidak dapat menghubungi server auth, mempertahankan sesi tersimpan.');
      }
    } catch (err) {
      console.warn('Pemeriksaan status sesi:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user, persistSession]);

  // On initial component mount: revalidate profile in background
  useEffect(() => {
    const init = async () => {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;
      if (savedToken) {
        await refreshProfile(true);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Login with email and password
  const loginWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Login gagal',
          isInvited: data.isInvited,
          inviteToken: data.inviteToken,
        };
      }

      persistSession(data.token, data.profile, data.umkm, data.mentor);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal' };
    } finally {
      setLoading(false);
    }
  };

  // Register UMKM
  const registerUmkm = async (payload: {
    fullName: string;
    businessName: string;
    email: string;
    whatsapp?: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-umkm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Pendaftaran gagal' };
      }

      persistSession(data.token, data.profile, data.umkm, null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal' };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Permintaan gagal' };
      }
      return {
        success: true,
        message: data.message,
        resetUrl: data.resetUrl,
        resetToken: data.resetToken,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal' };
    }
  };

  // Reset password
  const resetPassword = async (tokenParam: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParam, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Reset password gagal' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal' };
    }
  };

  // Verify mentor invite token
  const verifyInvite = async (inviteToken: string) => {
    try {
      const res = await fetch(`/api/auth/verify-invite?token=${encodeURIComponent(inviteToken)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        return { valid: false, error: data.error || 'Undangan tidak valid' };
      }
      return {
        valid: true,
        email: data.email,
        fullName: data.fullName,
        institution: data.institution,
      };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Gagal memverifikasi undangan' };
    }
  };

  // Accept mentor invite & set initial password
  const acceptInvite = async (inviteToken: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Aktivasi mentor gagal' };
      }

      persistSession(data.token, data.profile, null, data.mentor);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal' };
    } finally {
      setLoading(false);
    }
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      localStorage.setItem(STORAGE_KEYS.TOKEN, idToken);
      setToken(idToken);
      await refreshProfile(false);
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Switch demo role
  const switchDemoRole = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      if (!res.ok) {
        throw new Error('Gagal beralih akun demo');
      }

      const data = await res.json();
      persistSession(data.token, data.profile, data.umkm, data.mentor);
    } catch (err) {
      console.error('Switch demo role error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Explicit Sign Out (Only when user explicitly clicks Keluar / Logout)
  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.UMKM);
      localStorage.removeItem(STORAGE_KEYS.MENTOR);
      localStorage.removeItem(STORAGE_KEYS.LAST_TAB);
    }
    setToken(null);
    setUser(null);
    setUmkm(null);
    setMentor(null);
  };

  const role: UserRole = user?.role || 'UMKM';

  return (
    <AuthContext.Provider
      value={{
        user,
        umkm,
        mentor,
        role,
        token,
        loading,
        loginWithPassword,
        registerUmkm,
        forgotPassword,
        resetPassword,
        verifyInvite,
        acceptInvite,
        signInWithGoogle,
        signOut,
        switchDemoRole,
        refreshProfile,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
