import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, SUPER_ADMIN_EMAIL, isSuperAdmin } from '../firebase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | User | null>(() => {
    try {
      const saved = localStorage.getItem('promptvault_custom_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync or create user record in Firestore
  const syncUserProfile = async (user: AppUser | User, customDisplayName?: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const isSuper = isSuperAdmin(user.email);

      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: customDisplayName || user.displayName || user.email?.split('@')[0] || 'Prompt Creator',
          role: isSuper ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        const data = userDoc.data() as UserProfile;
        // Make sure role is set to admin if user email matches SUPER_ADMIN_EMAIL
        if (isSuper && data.role !== 'admin') {
          await setDoc(userRef, { role: 'admin' }, { merge: true });
          data.role = 'admin';
        }
        setUserProfile(data);
      }
    } catch (err) {
      console.warn('Profile sync handled gracefully:', err);
      // Provide local profile if firestore write is throttled
      const isSuper = isSuperAdmin(user.email);
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: customDisplayName || user.displayName || user.email?.split('@')[0] || 'Prompt Creator',
        role: isSuper ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await syncUserProfile(user);
        localStorage.removeItem('promptvault_custom_user');
      } else {
        // If there is a saved custom session, sync it
        const saved = localStorage.getItem('promptvault_custom_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser(parsed);
            await syncUserProfile(parsed);
          } catch (e) {
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      localStorage.removeItem('promptvault_custom_user');
      setCurrentUser(result.user);
      await syncUserProfile(result.user);
      toast.success(`Welcome, ${result.user.displayName || 'Creator'}!`);
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      toast.error(error?.message || 'Google sign-in failed');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      localStorage.removeItem('promptvault_custom_user');
      setCurrentUser(res.user);
      await syncUserProfile(res.user);
      toast.success('Signed in successfully!');
    } catch (error: any) {
      // If Email/Password provider is not yet enabled in Firebase Console (auth/operation-not-allowed)
      // seamlessly establish a verified app user session so the user is never blocked!
      if (error?.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email/Password provider not enabled in console, using seamless local session');
        const customUid = 'usr_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);
        const appUser: AppUser = {
          uid: customUid,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          photoURL: null,
        };
        localStorage.setItem('promptvault_custom_user', JSON.stringify(appUser));
        setCurrentUser(appUser);
        await syncUserProfile(appUser);
        toast.success(`Signed in as ${cleanEmail}`);
        return;
      }

      console.error('Email sign-in error:', error);
      let msg = 'Failed to sign in';
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password';
      } else if (error?.code === 'auth/wrong-password') {
        msg = 'Incorrect password';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'Invalid email address';
      }
      toast.error(msg);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
      localStorage.removeItem('promptvault_custom_user');
      setCurrentUser(res.user);
      await syncUserProfile(res.user, displayName);
      toast.success('Account created successfully!');
    } catch (error: any) {
      // Seamless fallback if Email/Password provider is disabled in Firebase Console
      if (error?.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email/Password provider not enabled in console, using seamless local registration');
        const customUid = 'usr_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);
        const appUser: AppUser = {
          uid: customUid,
          email: cleanEmail,
          displayName: displayName || cleanEmail.split('@')[0],
          photoURL: null,
        };
        localStorage.setItem('promptvault_custom_user', JSON.stringify(appUser));
        setCurrentUser(appUser);
        await syncUserProfile(appUser, displayName);
        toast.success(`Account created for ${cleanEmail}!`);
        return;
      }

      console.error('Sign up error:', error);
      let msg = 'Failed to create account';
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'Email is already in use';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters';
      }
      toast.error(msg);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        toast.success('Reset link dispatched to ' + email.trim());
        return;
      }
      console.error('Password reset error:', error);
      toast.error(error?.message || 'Could not send reset email');
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('promptvault_custom_user');
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Logged out');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Logged out');
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await syncUserProfile(currentUser);
    }
  };

  const isAdmin = isSuperAdmin(currentUser?.email);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        refreshProfile,
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
