import { useEffect, useState } from 'react';
import { initAuth, googleSignIn, getAccessToken, logout } from './lib/googleAuth';
import { PresentationConfig } from './types';
import type { AuthUser } from './lib/googleAuth';

// -- Auth Manager Module --
// Encapsulates Google auth logic: initAuth, googleSignIn, getAccessToken, logout,
// user/token state. Uses the updated googleAuth.ts.
// Exports hooks and functions for the App to use.

export interface AuthState {
  user: AuthUser | null;
  googleToken: string | null;
  isMock: boolean;
}

/**
 * useAuth — Initializes and manages Google Calendar authentication state.
 * 
 * Sets up the auth state listener via initAuth, tracks user/token state,
 * and provides login/logout functionality with clear mock/real mode indication.
 * 
 * @param presentationConfig — Global presentation config (for mockMode settings)
 * @returns Auth state and control functions
 */
export function useAuth(presentationConfig: PresentationConfig) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    googleToken: null,
    isMock: true, // Default to mock until initAuth resolves
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token, isMock) => {
        setAuthState({
          user: currentUser,
          googleToken: token,
          isMock,
        });
        // Log the active session
        const logText = `SESIÓN GOOGLE CALENDAR ACTIVE :: Conectado como ${currentUser.displayName || currentUser.email}`;
        // Note: onLogMessage not available here; App handles logging separately
      },
      () => {
        setAuthState({
          user: null,
          googleToken: null,
          isMock: true,
        });
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [presentationConfig]);

  const handleGoogleSignIn = async (): Promise<{ user: AuthUser | null; accessToken: string | null; isMock: boolean }> => {
    const result = await googleSignIn();
    if (result) {
      setAuthState({
        user: result.user,
        googleToken: result.accessToken,
        isMock: result.isMock,
      });
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
    setAuthState({
      user: null,
      googleToken: null,
      isMock: true,
    });
  };

  return {
    ...authState,
    handleGoogleSignIn,
    handleLogout,
  };
}

// Export the individual functions for direct use
export { initAuth, googleSignIn, getAccessToken, logout };