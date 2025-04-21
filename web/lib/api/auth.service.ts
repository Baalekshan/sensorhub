import httpClient, { apiRequest } from './http-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>({
      url: '/auth/login',
      method: 'POST',
      data: credentials
    });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },
  
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>({
      url: '/auth/register',
      method: 'POST',
      data: userData
    });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },
  
  async logout(): Promise<void> {
    try {
      await apiRequest<void>({
        url: '/auth/logout',
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token regardless of API response
      localStorage.removeItem('auth_token');
    }
  },
  
  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiRequest<User>({
        url: '/auth/me',
        method: 'GET'
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}; 