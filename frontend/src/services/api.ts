/**
 * API service for YATAV Training System
 * Handles all HTTP requests to the backend server
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  total_sessions: number;
  total_hours: number;
  average_score: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TrainingProgramConfig {
  available: boolean;
  scenario?: string;
  difficulty_adjustment?: number;
  session_type?: string;
  focus_skills?: string[];
  urgency_level?: string;
  intervention_type?: string;
  safety_concerns?: string[];
  recommended_techniques?: string[];
  theoretical_background?: string;
  complexity_level?: string;
}

export interface TrainingPrograms {
  basic: TrainingProgramConfig;
  crisis: TrainingProgramConfig;
  techniques: TrainingProgramConfig;
}

export interface VirtualCharacter {
  id: string;
  name: string;
  age: number;
  gender: string;
  issue: string;
  difficulty: number;
  background: string;
  primary_issue: string;
  personality: string;
  character_type: string;
  training_programs?: TrainingPrograms;
  is_active: boolean;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  program_id: string;
  character_id: string;
  title: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  duration_minutes: number;
  messages: Message[];
  scores: Record<string, number>;
  feedback?: any;
}

export interface Message {
  id: string;
  session_id: string;
  sender: 'user' | 'character' | 'system';
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface CreateSessionRequest {
  program_id: string;
  character_id: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: string;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  
  constructor() {
    this.baseURL = 'http://127.0.0.1:8008';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  getToken(): string | null {
    return localStorage.getItem('yatav_token');
  }

  setAuth(token: string, user: User): void {
    localStorage.setItem('yatav_token', token);
    localStorage.setItem('yatav_user', JSON.stringify(user));
  }

  clearAuth(): void {
    localStorage.removeItem('yatav_token');
    localStorage.removeItem('yatav_user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('yatav_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', credentials);
      const { access_token, user } = response.data;
      this.setAuth(access_token, user);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', userData);
      const { access_token, user } = response.data;
      this.setAuth(access_token, user);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.clearAuth();
  }

  async getCurrentUserInfo(): Promise<User> {
    try {
      const response = await this.api.get<User>('/auth/me');
      // Update local user data
      localStorage.setItem('yatav_user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  // Characters endpoints
  async getCharacters(): Promise<VirtualCharacter[]> {
    try {
      const response = await this.api.get<VirtualCharacter[]>('/characters');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      throw error;
    }
  }

  async getCharactersByProgram(programType: string): Promise<VirtualCharacter[]> {
    try {
      const response = await this.api.get<VirtualCharacter[]>(`/characters/program/${programType}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch characters for program ${programType}:`, error);
      throw error;
    }
  }

  async getProgramCharacterStats(programType: string): Promise<any> {
    try {
      const response = await this.api.get<any>(`/characters/program/${programType}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch character stats for program ${programType}:`, error);
      throw error;
    }
  }

  // Admin endpoints
  async getAdminStats(): Promise<any> {
    try {
      const response = await this.api.get<any>('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      const response = await this.api.get<any>('/admin/system-health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }

  async getApiUsage(): Promise<any> {
    try {
      const response = await this.api.get<any>('/admin/api-usage');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API usage:', error);
      throw error;
    }
  }

  async getApiEndpoints(): Promise<any> {
    try {
      const response = await this.api.get<any>('/admin/api-endpoints');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API endpoints:', error);
      throw error;
    }
  }

  async updateApiConfig(config: any): Promise<any> {
    try {
      const response = await this.api.post<any>('/admin/api-config', config);
      return response.data;
    } catch (error) {
      console.error('Failed to update API config:', error);
      throw error;
    }
  }

  // Update base URL for API service
  updateBaseUrl(newBaseUrl: string): void {
    this.api.defaults.baseURL = newBaseUrl;
    localStorage.setItem('api_base_url', newBaseUrl);
  }

  getCurrentBaseUrl(): string {
    return this.api.defaults.baseURL || 'http://127.0.0.1:8008';
  }

  // System Settings endpoints
  async getSystemSettings(): Promise<any> {
    try {
      const response = await this.api.get<any>('/admin/system-settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: any): Promise<any> {
    try {
      const response = await this.api.post<any>('/admin/system-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  }

  async createSystemBackup(): Promise<any> {
    try {
      const response = await this.api.post<any>('/admin/system-backup');
      return response.data;
    } catch (error) {
      console.error('Failed to create system backup:', error);
      throw error;
    }
  }

  async getSystemLogs(limit: number = 100): Promise<any> {
    try {
      const response = await this.api.get<any>(`/admin/system-logs?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      throw error;
    }
  }

  async clearSystemLogs(): Promise<any> {
    try {
      const response = await this.api.delete<any>('/admin/clear-logs');
      return response.data;
    } catch (error) {
      console.error('Failed to clear system logs:', error);
      throw error;
    }
  }

  async getCharacter(characterId: string): Promise<VirtualCharacter> {
    try {
      const response = await this.api.get<VirtualCharacter>(`/characters/${characterId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch character:', error);
      throw error;
    }
  }

  // Sessions endpoints
  async createSession(sessionData: CreateSessionRequest): Promise<TrainingSession> {
    try {
      const response = await this.api.post<TrainingSession>('/sessions', null, {
        params: sessionData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async getUserSessions(): Promise<TrainingSession[]> {
    try {
      const response = await this.api.get<TrainingSession[]>('/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<TrainingSession> {
    try {
      const response = await this.api.get<TrainingSession>(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch session:', error);
      throw error;
    }
  }

  async addMessage(sessionId: string, messageData: Partial<Message>): Promise<{ status: string; message_id: string }> {
    try {
      const response = await this.api.post(`/sessions/${sessionId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  // WebSocket connection
  createWebSocket(sessionId: string): WebSocket {
    const token = this.getToken();
    const wsUrl = `ws://127.0.0.1:8008/ws/${sessionId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for session:', sessionId);
      // Send auth token if needed
      if (token) {
        ws.send(JSON.stringify({ type: 'auth', token }));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected for session:', sessionId);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }

  // Audio endpoints (future implementation)
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await this.api.post('/audio/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      throw error;
    }
  }

  async synthesizeSpeech(text: string, voiceId?: string): Promise<Blob> {
    try {
      const response = await this.api.post('/audio/synthesize', 
        { text, voice_id: voiceId },
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      throw error;
    }
  }

  // Utility methods
  async uploadFile(file: File, endpoint: string): Promise<{ url: string; filename: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // Error handling helper
  handleApiError(error: any): string {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || error.response.statusText;
      return `Server Error: ${message}`;
    } else if (error.request) {
      // Network error
      return 'Network Error: Unable to connect to server. Please check your connection.';
    } else {
      // Other error
      return `Error: ${error.message}`;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export singleton and types
export default apiService;
export { apiService };
export type { ApiService };