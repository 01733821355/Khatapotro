import type { GoogleUser } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any; error_description?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

import firebaseConfig from '../../firebase-applet-config.json';

// OAuth client ID for KhataPotro Google Services
export const GOOGLE_CLIENT_ID = 
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  firebaseConfig.oAuthClientId || 
  '689412959744-qs3g09bcc1gq8oo0isf3vli3vr309or2.apps.googleusercontent.com';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

const USER_STORAGE_KEY = 'khatapotro_gsi_user_v1';
const TOKEN_STORAGE_KEY = 'khatapotro_google_access_token_v1';
const EXPIRY_STORAGE_KEY = 'khatapotro_google_token_expiry_v1';

let cachedUser: GoogleUser | null = (() => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

let cachedToken: string | null = (() => {
  try {
    const exp = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (exp && Date.now() > Number(exp)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(EXPIRY_STORAGE_KEY);
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
})();

// Wait for window.google to be loaded
const waitForGoogleAccounts = (maxWaitMs = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
};

/**
 * Fetch profile info from Google using access token
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('গুগল প্রোফাইল তথ্য লোড করা যায়নি');
  }
  const data = await res.json();
  const user: GoogleUser = {
    uid: data.sub || `g_${Date.now()}`,
    email: data.email || null,
    displayName: data.name || data.given_name || 'Gmail User',
    photoURL: data.picture || null,
  };
  return user;
}

/**
 * Standard One-Click Google / Gmail Sign In without Firebase domain restrictions.
 * Works seamlessly across localhost, Netlify, Cloud Run, Custom Domains, etc.
 */
export async function signInWithGoogle(): Promise<{ user: GoogleUser; accessToken: string }> {
  const loaded = await waitForGoogleAccounts();
  if (!loaded || !window.google?.accounts?.oauth2) {
    throw new Error('গুগল সাইন-ইন সার্ভিস লোড হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন বা ইন্টারনেট চেক করুন।');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
              console.info('Google sign-in was closed or cancelled by user:', tokenResponse.error);
              const cancelErr: any = new Error('গুগল সাইন-ইন বাতিল করা হয়েছে।');
              cancelErr.isCancelled = true;
              cancelErr.code = 'auth/popup-closed';
              reject(cancelErr);
              return;
            }
            console.error('Google Auth Error:', tokenResponse.error);
            reject(new Error(tokenResponse.error_description || 'গুগল সাইন ইন বাতিল হয়েছে বা ব্যর্থ হয়েছে।'));
            return;
          }

          if (tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            cachedToken = token;
            const expiresInSec = Number((tokenResponse as any).expires_in) || 3600;
            const expiryTimestamp = Date.now() + (expiresInSec - 120) * 1000;

            try {
              localStorage.setItem(TOKEN_STORAGE_KEY, token);
              localStorage.setItem(EXPIRY_STORAGE_KEY, String(expiryTimestamp));
            } catch {
              // ignore
            }

            try {
              const user = await fetchGoogleUserProfile(token);
              cachedUser = user;
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
              resolve({ user, accessToken: token });
            } catch {
              // Fallback user if profile fetch gets network glitch
              const fallbackUser: GoogleUser = {
                uid: 'google_user_' + Date.now(),
                displayName: 'Gmail User',
                email: 'user@gmail.com',
              };
              cachedUser = fallbackUser;
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallbackUser));
              resolve({ user: fallbackUser, accessToken: token });
            }
          } else {
            reject(new Error('গুগল থেকে অ্যাক্সেস টোকেন পাওয়া যায়নি।'));
          }
        },
        error_callback: (err) => {
          if (err?.type === 'popup_closed' || err?.message?.includes('closed')) {
            console.info('Google sign-in popup was closed by user.');
            const cancelErr: any = new Error('গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।');
            cancelErr.isCancelled = true;
            cancelErr.code = 'auth/popup-closed';
            reject(cancelErr);
            return;
          }
          if (err?.type === 'popup_failed_to_open') {
            console.warn('Google sign-in popup was blocked by browser:', err);
            const blockedErr: any = new Error('ব্রাউজারে পপ-আপ ব্লক করা আছে। ব্রাউজারের অ্যাড্রেস বার থেকে পপ-আপ এলাউ করুন।');
            blockedErr.code = 'auth/popup-blocked';
            reject(blockedErr);
            return;
          }
          console.warn('Google OAuth client notice:', err);
          reject(new Error(err?.message || 'গুগল সাইন-ইন প্রক্রিয়া সম্পন্ন হয়নি।'));
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      console.error('Google Auth Exception:', err);
      reject(err);
    }
  });
}

export function getStoredAuth(): { user: GoogleUser | null; token: string | null } {
  try {
    const exp = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (exp && Date.now() > Number(exp)) {
      cachedToken = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(EXPIRY_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  return { user: cachedUser, token: cachedToken };
}

export function signOutGoogle() {
  cachedUser = null;
  cachedToken = null;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
