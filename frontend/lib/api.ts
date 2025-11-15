/**
 * API Client for RRent Backend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  return fetchAPI<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version?: string;
  }>('/health');
}

/**
 * Readiness check endpoint
 */
export async function checkReadiness() {
  return fetchAPI<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version?: string;
    database: {
      connected: boolean;
      responseTime?: number;
    };
    checks: {
      database: boolean;
    };
  }>('/health/ready');
}

// Export the base fetch function for custom requests
export { fetchAPI };
