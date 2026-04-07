/**
 * API Client Helper for E-Ration Shop
 * 
 * This utility handles:
 * - Base URL configuration
 * - HTTP-only cookie credentials
 * - Standard headers
 * - Error response formatting
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

interface RequestOptions extends RequestInit {
    data?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

// Helper to throw consistent errors
class ApiError extends Error {
    public status: number;
    public data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { data, headers, ...customConfig } = options;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    const config: RequestInit = {
        ...customConfig,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        // CRITICAL: Required for HTTP-Only Cookies to work
        credentials: 'include',
        signal: controller.signal,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const fullUrl = `${BASE_URL}${endpoint}`;
        console.log(`[API CLIENT] Sending ${config.method || 'GET'} to: ${fullUrl}`);
        const response = await fetch(fullUrl, config);

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Backend returns { success: false, message: "..." }
            // Use that message if available, else fallback
            const errorMessage = responseData.message || response.statusText;
            throw new ApiError(response.status, errorMessage, responseData);
        }

        // Backend returns consistent { success: true, data: T } or direct T depending on endpoint legacy.
        // Our hardened backend returns { success: true, data: ... } mostly, 
        // but some early endpoints might return array/object directly.
        // Let's verify response structure.

        return (responseData.data !== undefined ? responseData.data : responseData) as T;
    } catch (error: any) {
        // Re-throw ApiError or wrap standard Error
        if (error instanceof ApiError) {
            throw error;
        }
        if (error?.name === 'AbortError') {
            throw new ApiError(504, 'Server timed out. Please check that the backend is running and try again.', null);
        }
        if (error?.message?.includes('Failed to fetch')) {
            throw new ApiError(503, 'Backend server is unreachable. Start the backend on port 5001 and try again.', null);
        }
        throw new ApiError(500, error.message || 'Network Error', null);
    } finally {
        window.clearTimeout(timeoutId);
    }
}

// Public API Methods
export const api = {
    get: <T>(endpoint: string, headers?: HeadersInit) => request<T>(endpoint, { method: 'GET', headers }),
    post: <T>(endpoint: string, data: any, headers?: HeadersInit) => request<T>(endpoint, { method: 'POST', data, headers }),
    put: <T>(endpoint: string, data: any, headers?: HeadersInit) => request<T>(endpoint, { method: 'PUT', data, headers }),
    delete: <T>(endpoint: string, headers?: HeadersInit) => request<T>(endpoint, { method: 'DELETE', headers }),
};

export default api;
