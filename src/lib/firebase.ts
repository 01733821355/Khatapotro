import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User 
} from 'firebase/auth';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const CUSTOM_CONFIG_KEY = 'khatapotro_custom_firebase_config_v1';

export function getActiveFirebaseConfig() {
  const env = (import.meta as any).env || {};
  // 1. Environment variables if specified in Netlify or .env
  if (env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'khatapotor.firebaseapp.com',
      projectId: env.VITE_FIREBASE_PROJECT_ID || 'khatapotor',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'khatapotor.firebasestorage.app',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
    };
  }

  // 2. Custom config saved in localStorage
  try {
    const saved = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && (parsed.authDomain || parsed.projectId)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback to default
  return defaultFirebaseConfig;
}

export function saveCustomFirebaseConfig(config: any) {
  try {
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function clearCustomFirebaseConfig() {
  try {
    localStorage.removeItem(CUSTOM_CONFIG_KEY);
  } catch {
    // ignore
  }
}

const activeConfig = getActiveFirebaseConfig();

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
export const auth = getAuth(app);

// Scopes required for KhataPotro Sheets & Drive integration
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
// Prompt user to select account and grant offline/consent
provider.setCustomParameters({
  prompt: 'select_account consent',
  access_type: 'offline'
});

const ACCESS_TOKEN_STORAGE_KEY = 'khatapotro_google_access_token_v1';

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token in memory with localStorage backup
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
})();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      // Do not clear storage on initial null auth state so GIS token persists
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('গুগল থেকে অ্যাক্সেস টোকেন পাওয়া যায়নি। অনুগ্রহ করে সব পারমিশন অনুমোদন করুন।');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, credential.accessToken);
    } catch {
      // ignore
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user') {
      console.info('Firebase popup was closed by user');
      const cancelErr: any = new Error('গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।');
      cancelErr.isCancelled = true;
      cancelErr.code = 'auth/popup-closed';
      throw cancelErr;
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Firebase popup was blocked by browser');
      const blockedErr: any = new Error('ব্রাউজারে পপ-আপ ব্লক করা আছে। ব্রাউজারের অ্যাড্রেস বার থেকে পপ-আপ এলাউ করুন।');
      blockedErr.code = 'auth/popup-blocked';
      throw blockedErr;
    }
    console.error('Google sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
};
