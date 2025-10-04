/**
 * API utility functions for authenticated requests
 */

const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export const authenticatedRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    // No token available, redirect to login
    window.location.href = '/auth';
    return { error: 'No access token', status: 401 };
  }

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const isExpired = payload.exp < currentTime;
    
    if (isExpired) {
      // Try to refresh the token
      const refreshSuccess = await refreshAccessToken();
      if (!refreshSuccess) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('profile');
        window.location.href = '/auth';
        return { error: 'Token expired and refresh failed', status: 401 };
      }
    }
  } catch (error) {
    // Token is invalid, redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    window.location.href = '/auth';
    return { error: 'Invalid token', status: 401 };
  }

  // Make the request with the (possibly refreshed) token
  const updatedToken = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${updatedToken}`,
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Try to refresh token once more
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      // Retry the request with new token
      const newToken = localStorage.getItem('access_token');
      const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
          ...options.headers,
        },
      });
      
      if (retryResponse.ok) {
        const data = await retryResponse.json();
        return { data, status: retryResponse.status };
      }
    }
    
    // Refresh failed or retry failed, logout and redirect
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    window.location.href = '/auth';
    return { error: 'Authentication failed', status: 401 };
  }

  const data = response.ok ? await response.json() : null;
  return { data, error: response.ok ? undefined : `HTTP ${response.status}`, status: response.status };
};

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    
    // Update refresh token if provided
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Make a GET request
 */
export const apiGet = <T = any>(url: string): Promise<ApiResponse<T>> => {
  return authenticatedRequest<T>(url, { method: 'GET' });
};

/**
 * Make a POST request
 */
export const apiPost = <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
  return authenticatedRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PUT request
 */
export const apiPut = <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
  return authenticatedRequest<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PATCH request
 */
export const apiPatch = <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
  return authenticatedRequest<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = <T = any>(url: string): Promise<ApiResponse<T>> => {
  return authenticatedRequest<T>(url, { method: 'DELETE' });
};
