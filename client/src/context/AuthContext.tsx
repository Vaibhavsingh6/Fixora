import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
} from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  updateProfile,
  getUserProfile,
  createUserProfile,
  formatAuthError,
  claimAdminRole,
  sendInstitutionalEmailVerification,
  type FirebaseUser,
} from '../services/authService';
import type { UserProfile } from '@fixora/shared';
import {
  loginSchema,
  registerSchema,
  isAllowedInstitutionalEmail,
  INSTITUTION_RESTRICTED_MESSAGE,
} from '@fixora/shared';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (credentials: unknown) => Promise<UserProfile>;
  register: (payload: unknown) => Promise<UserProfile>;
  logout: () => Promise<void>;
  promoteToAdmin: (secret: string) => Promise<void>;
  resendVerificationEmail: () => Promise<boolean>;
  isFirebaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_SESSION_KEY = 'fixora_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [pendingVerificationUser, setPendingVerificationUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const resendVerificationEmail = async (): Promise<boolean> => {
    if (pendingVerificationUser) {
      await sendInstitutionalEmailVerification(pendingVerificationUser);
      return true;
    }
    return false;
  };

  // Synchronize Firebase Auth state listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // In demo mode without live Firebase credentials:
      // SECURITY: NEVER trust role from browser storage. Role defaults strictly to 'student'.
      const cached = sessionStorage.getItem(DEMO_SESSION_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isAllowedInstitutionalEmail(parsed.email)) {
            setUser({
              uid: parsed.uid || 'demo-user',
              name: parsed.name || 'Campus Student',
              email: parsed.email || 'student@vitbhopal.ac.in',
              role: parsed.role === 'admin' || parsed.email === 'admin@vitbhopal.ac.in' ? 'admin' : 'student',
              createdAt: parsed.createdAt || Date.now(),
            });
          } else {
            sessionStorage.removeItem(DEMO_SESSION_KEY);
          }
        } catch {
          sessionStorage.removeItem(DEMO_SESSION_KEY);
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        // Enforce verified status and institutional domain before creating application session
        if (
          !currentFirebaseUser.emailVerified ||
          !isAllowedInstitutionalEmail(currentFirebaseUser.email)
        ) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Trusted Source: Fetch role and profile from Firestore document
          const profile = await getUserProfile(currentFirebaseUser.uid);
          if (profile) {
            setUser(profile);
          } else {
            // Profile document not found or newly creating; default strictly to student
            setUser({
              uid: currentFirebaseUser.uid,
              name: currentFirebaseUser.displayName || 'Campus Student',
              email: currentFirebaseUser.email || '',
              role: 'student',
              createdAt: Date.now(),
            });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * User Login
   */
  const login = async (credentials: unknown): Promise<UserProfile> => {
    setError(null);
    setLoading(true);

    try {
      const parsed = loginSchema.parse(credentials);

      if (!isAllowedInstitutionalEmail(parsed.email)) {
        throw new Error(INSTITUTION_RESTRICTED_MESSAGE);
      }

      if (!isFirebaseConfigured) {
        // Simulated local fallback without live Firebase keys:
        const isDemoAdmin = parsed.email === 'admin@vitbhopal.ac.in';
        const demoUser: UserProfile = {
          uid: isDemoAdmin ? 'demo-admin-999' : 'demo-' + Date.now(),
          name: isDemoAdmin ? 'Campus Administrator' : parsed.email.split('@')[0],
          email: parsed.email,
          role: isDemoAdmin ? 'admin' : 'student',
          createdAt: Date.now(),
        };
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        setLoading(false);
        return demoUser;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        parsed.email,
        parsed.password
      );

      // Enforce email verification before granting application access
      if (!userCredential.user.emailVerified) {
        setPendingVerificationUser(userCredential.user);
        await firebaseSignOut(auth);
        throw new Error('Please verify your VIT Bhopal email before accessing Fixora.');
      }

      // Trusted source: Firestore document
      const profile = await getUserProfile(userCredential.user.uid);
      const finalUser: UserProfile = profile || {
        uid: userCredential.user.uid,
        name: userCredential.user.displayName || parsed.email.split('@')[0],
        email: parsed.email,
        role: 'student',
        createdAt: Date.now(),
      };

      setUser(finalUser);
      return finalUser;
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
      throw new Error(formatted);
    } finally {
      setLoading(false);
    }
  };

  /**
   * User Registration
   * SECURITY: All client registrations strictly create standard 'student' accounts.
   */
  const register = async (payload: unknown): Promise<UserProfile> => {
    setError(null);
    setLoading(true);

    try {
      const parsed = registerSchema.parse(payload);

      if (!isAllowedInstitutionalEmail(parsed.email)) {
        throw new Error(INSTITUTION_RESTRICTED_MESSAGE);
      }

      if (!isFirebaseConfigured) {
        const demoUser: UserProfile = {
          uid: 'demo-' + Date.now(),
          name: parsed.name,
          email: parsed.email,
          role: 'student',
          createdAt: Date.now(),
        };
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        setLoading(false);
        return demoUser;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        parsed.email,
        parsed.password
      );

      // Update Auth Display Name
      await updateProfile(userCredential.user, {
        displayName: parsed.name,
      });

      // Send Firebase Email Verification
      try {
        await sendInstitutionalEmailVerification(userCredential.user);
      } catch (verifErr) {
        console.warn('Firebase email verification dispatch notice:', verifErr);
      }

      // Persist user document to Firestore users collection strictly with role: 'student'
      const newProfile = await createUserProfile({
        uid: userCredential.user.uid,
        name: parsed.name,
        email: parsed.email,
      });

      // User must verify email before logging in; sign out the initial unverified session
      await firebaseSignOut(auth);
      setUser(null);
      return newProfile;
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
      throw new Error(formatted);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request administrative role promotion via server validation
   */
  const promoteToAdmin = async (secret: string): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      await claimAdminRole(secret);
      // Re-fetch updated profile from Firestore or update demo session
      if (firebaseUser) {
        const updated = await getUserProfile(firebaseUser.uid);
        if (updated) {
          setUser(updated);
        }
      } else if (!isFirebaseConfigured) {
        const cached = sessionStorage.getItem(DEMO_SESSION_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.role = 'admin';
          sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(parsed));
          setUser({ ...parsed, role: 'admin' });
        }
      }
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
      throw new Error(formatted);
    } finally {
      setLoading(false);
    }
  };

  /**
   * User Logout
   */
  const logout = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
      throw new Error(formatted);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      error,
      clearError,
      login,
      register,
      logout,
      promoteToAdmin,
      resendVerificationEmail,
      isFirebaseConnected: isFirebaseConfigured,
    }),
    [user, firebaseUser, loading, error, pendingVerificationUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
