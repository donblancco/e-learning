import { User, AuthTokens, LoginCredentials, RegisterCredentials } from '../types';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'https://your-domain.com'}/api/auth`;

class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getApiBaseUrl(): string {
    return process.env.REACT_APP_API_URL || 'https://your-domain.com';
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Login error response:', error);
        // エラーメッセージを詳細に処理
        let errorMessage = 'ログインに失敗しました';
        if (error.detail) {
          errorMessage = error.detail;
        } else if (error.email) {
          errorMessage = Array.isArray(error.email) ? error.email.join('\n') : error.email;
        } else if (error.password) {
          errorMessage = Array.isArray(error.password) ? error.password.join('\n') : error.password;
        } else if (error.non_field_errors) {
          errorMessage = Array.isArray(error.non_field_errors) ? error.non_field_errors.join('\n') : error.non_field_errors;
        } else if (typeof error === 'object') {
          const firstError = Object.values(error)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError.join('\n');
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Login successful, user:', data.user);
      this.setTokens(data.tokens);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      console.log('Sending registration request to:', `${API_BASE_URL}/register/`);
      console.log('Request body:', credentials);
      
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Registration error response:', error);
        // エラーメッセージを詳細に処理
        let errorMessage = '登録に失敗しました';
        if (error.detail) {
          errorMessage = error.detail;
        } else if (error.password) {
          errorMessage = Array.isArray(error.password) ? error.password.join('\n') : error.password;
        } else if (error.email) {
          errorMessage = Array.isArray(error.email) ? error.email.join('\n') : error.email;
        } else if (error.username) {
          errorMessage = Array.isArray(error.username) ? error.username.join('\n') : error.username;
        } else if (error.non_field_errors) {
          errorMessage = Array.isArray(error.non_field_errors) ? error.non_field_errors.join('\n') : error.non_field_errors;
        } else if (typeof error === 'object') {
          const firstError = Object.values(error)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError.join('\n');
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      this.setTokens(data.tokens);
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('リフレッシュトークンがありません');
      }

      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('トークンの更新に失敗しました');
      }

      const data = await response.json();
      this.setAccessToken(data.access);
      return data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async getAuthHeaders(): Promise<HeadersInit> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('認証が必要です');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const authService = AuthService.getInstance();