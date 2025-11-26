// Session storage utilities for managing user sessions
export class SessionManager {
  private static readonly USER_DATA_KEY = 'user_data';
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Store user session data
  static setSessionData(userData: any, tokens: { access: string; refresh: string }) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
  }

  // Get user session data
  static getSessionData() {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem(this.USER_DATA_KEY);
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!userData || !accessToken || !refreshToken) return null;

    return {
      user: JSON.parse(userData),
      tokens: { access: accessToken, refresh: refreshToken }
    };
  }

  // Clear all session data
  static clearSession() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.USER_DATA_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.clear();

    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLogout'));
  }

  // Check if session exists
  static hasSession(): boolean {
    if (typeof window === 'undefined') return false;

    return !!(
      localStorage.getItem(this.ACCESS_TOKEN_KEY) &&
      localStorage.getItem(this.REFRESH_TOKEN_KEY)
    );
  }

  // Update access token
  static updateAccessToken(accessToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
  }

  // Get access token
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Get refresh token
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
}

// Session validation utility
export const validateUserSession = async (): Promise<boolean> => {
  try {
    const sessionData = SessionManager.getSessionData();
    if (!sessionData) return false;

    // Make a request to validate the session
    const response = await fetch('/api/auth/profile/', {
      headers: {
        'Authorization': `Bearer ${sessionData.tokens.access}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return true;
    } else if (response.status === 401) {
      // Token expired, try to refresh
      const refreshResponse = await fetch('/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: sessionData.tokens.refresh }),
      });

      if (refreshResponse.ok) {
        const { access } = await refreshResponse.json();
        SessionManager.updateAccessToken(access);
        return true;
      } else {
        // Refresh failed, clear session
        SessionManager.clearSession();
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Session validation failed:', error);
    SessionManager.clearSession();
    return false;
  }
};
