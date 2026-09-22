import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UmkmProfile, MentorProfile, UserRole } from '../types/index.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';

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
  refreshProfile: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [umkm, setUmkm] = useState<UmkmProfile | null>(null);
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Helper authenticated fetch
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = token || localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
  };

  const refreshProfile = async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) {
      setUser(null);
      setUmkm(null);
      setMentor(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.profile);
        setUmkm(data.umkm);
        setMentor(data.mentor);
      } else {
        // Token might have expired or user suspended
        console.warn('Session expired or profile failed');
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setUmkm(null);
        setMentor(null);
      }
    } catch (err) {
      console.error('Failed to fetch /api/auth/me:', err);
    } finally {
      setLoading(false);
    }
  };

  // On mount: check auth token
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('auth_token');
      if (saved) {
        setToken(saved);
        await refreshProfile();
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

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.profile);
      setUmkm(data.umkm);
      setMentor(data.mentor);
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

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.profile);
      setUmkm(data.umkm);
      setMentor(null);
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
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
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
  const verifyInvite = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-invite?token=${encodeURIComponent(token)}`);
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
  const acceptInvite = async (token: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Aktivasi mentor gagal' };
      }

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.profile);
      setMentor(data.mentor);
      setUmkm(null);
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
      localStorage.setItem('auth_token', idToken);
      setToken(idToken);
      await refreshProfile();
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
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.profile);
      setUmkm(data.umkm);
      setMentor(data.mentor);
    } catch (err) {
      console.error('Switch demo role error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('auth_token');
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
