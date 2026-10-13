/**
 * MOCK GOOGLE AUTH / CALENDAR — DELIBERATE SIMULATION (CONSEQ-FIX P0-2).
 *
 * This module ships two modes:
 *  1. Real Firebase Google sign-in, used only when `firebase-applet-config.json`
 *     carries actual credentials.
 *  2. A high-fidelity SIMULATED session used when the config is a placeholder.
 *     In that mode no network request is ever made: `MOCK_GOOGLE_CALENDAR_TOKEN`
 *     short-circuits every Calendar call (create/update/delete/fetch) so the UI
 *     behaves like a connected account without touching Google.
 *
 * Strategy B: real Firebase wiring was implemented first; the mock branch stays
 * as the explicit fallback. Remove this branch once real OAuth is configured.
 */
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { safeGet, safeSet } from './storage';

// Simulated access token (value unchanged on purpose: existing mock sessions keep working).
export const MOCK_GOOGLE_CALENDAR_TOKEN = 'simulated_access_token_google_calendar_sota';
// Consumers can branch on this instead of guessing from token shape.
export const IS_MOCK_GOOGLE_CALENDAR = true;

// Detect if Firebase has actual credentials or is still using placeholder
const isDummyConfig = 
  !firebaseConfig || 
  firebaseConfig.apiKey === 'PLACEHOLDER_API_KEY' || 
  !firebaseConfig.apiKey;

let app;
let auth: any = null;
const provider = new GoogleAuthProvider();

// Request Calendar Scopes
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

if (!isDummyConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.warn("Failed to initialize remote Firebase Auth: ", err);
  }
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Union type for Firebase User or simulated user
export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

// Initialize Auth Listener
export const initAuth = (
  onAuthSuccess?: (user: AuthUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (isDummyConfig || !auth) {
    // In dummy mode, try to restoration of simulated local session if any
    const savedUser = safeGet<AuthUser | null>('simulated_user', null);
    const savedToken = safeGet<string | null>('simulated_token', null);
    if (savedUser && savedToken) {
      cachedAccessToken = savedToken;
      if (onAuthSuccess) {
        onAuthSuccess(savedUser, savedToken);
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
    return () => {};
  }

  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In trigger
export const googleSignIn = async (): Promise<{ user: AuthUser; accessToken: string } | null> => {
  if (isDummyConfig || !auth) {
    // Elegant high-fidelity Simulation sign-in
    console.log("Using High-Fidelity Simulated Google Session...");
    const simulatedUser = {
      uid: 'simulated-google-uid-123',
      displayName: 'Workspace User',
      email: 'ia.strongmagazine@gmail.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    };
    const simulatedToken = MOCK_GOOGLE_CALENDAR_TOKEN;
    
    cachedAccessToken = simulatedToken;
    safeSet('simulated_user', simulatedUser);
    safeSet('simulated_token', simulatedToken);
    
    return { user: simulatedUser, accessToken: simulatedToken };
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el Token de Acceso desde Firebase.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Logout trigger
export const logout = async () => {
  localStorage.removeItem('simulated_user');
  localStorage.removeItem('simulated_token');
  cachedAccessToken = null;
  if (auth) {
    await auth.signOut();
  }
};

// REST API wrapper for Google Calendar Events
export const fetchCalendarEvents = async (token: string) => {
  if (token === MOCK_GOOGLE_CALENDAR_TOKEN) {
    // Return simulated agenda queue parsed from locale
    return null;
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Error al obtener los eventos de Google Calendar');
  }
  const data = await response.json();
  return data.items || [];
};

export const createCalendarEvent = async (token: string, event: { title: string; description: string; time: string }) => {
  if (token === MOCK_GOOGLE_CALENDAR_TOKEN) {
    return { id: `G-SIM-${Math.floor(Math.random() * 89999 + 10000)}` };
  }

  // Map "HH:MM" format to realistic today dateTime bounds
  const [hours, minutes] = event.time.split(':');
  const now = new Date();
  const startEvent = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
  const endEvent = new Date(startEvent.getTime() + 60 * 60 * 1000); // 1 hour duration

  const body = {
    summary: event.title,
    description: event.description,
    start: { dateTime: startEvent.toISOString() },
    end: { dateTime: endEvent.toISOString() }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('No se pudo guardar el evento en Google Calendar');
  }
  return await response.json();
};

export const updateCalendarEvent = async (
  token: string, 
  eventId: string, 
  event: { title: string; description: string; time: string }
) => {
  if (token === MOCK_GOOGLE_CALENDAR_TOKEN || eventId.startsWith('G-SIM-') || eventId.startsWith('MTG-')) {
    return true;
  }

  const [hours, minutes] = event.time.split(':');
  const now = new Date();
  const startEvent = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
  const endEvent = new Date(startEvent.getTime() + 60 * 60 * 1000);

  const body = {
    summary: event.title,
    description: event.description,
    start: { dateTime: startEvent.toISOString() },
    end: { dateTime: endEvent.toISOString() }
  };

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar el evento en Google Calendar');
  }
  return await response.json();
};

export const deleteCalendarEvent = async (token: string, eventId: string) => {
  if (token === MOCK_GOOGLE_CALENDAR_TOKEN || eventId.startsWith('G-SIM-') || eventId.startsWith('MTG-')) {
    return true;
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('No se pudo eliminar el evento en Google Calendar');
  }
  return true;
};
