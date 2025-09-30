export const API_BASE_URL = '';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    // Handle authentication errors
    if (res.status === 401) {
      // Try to refresh token first
      const newToken = await refreshToken();
      if (!newToken) {
        // Refresh failed, trigger logout
        window.dispatchEvent(new CustomEvent('userLogout'));
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Retry the request with new token
      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          ...getAuthHeaders(),
          ...(init?.headers || {}),
        },
        cache: 'no-store',
      });
      
      if (!retryRes.ok) {
        const message = await retryRes.text().catch(() => retryRes.statusText);
        throw new Error(message || `Request failed: ${retryRes.status}`);
      }
      
      if (retryRes.status === 204) return undefined as unknown as T;
      return retryRes.json() as Promise<T>;
    }
    
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed: ${res.status}`);
  }
  
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// Helper function to refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) return null;
    
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return data.access;
    } else {
      // Refresh failed, clear tokens and trigger logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      sessionStorage.clear();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('userLogout'));
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};


