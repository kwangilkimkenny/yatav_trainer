/**
 * React hooks for API interactions
 * Provides easy-to-use hooks for common API operations
 */

import { useState, useEffect, useCallback } from 'react';
import apiService, { User, VirtualCharacter, TrainingSession, Message } from '../services/api';

// Types for hook states
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

// Generic API hook
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await apiCall();
        
        if (!isCancelled) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (error: any) {
        if (!isCancelled) {
          setState({ 
            data: null, 
            loading: false, 
            error: apiService.handleApiError(error) 
          });
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, dependencies);

  return state;
}

// Authentication hooks
export function useAuth() {
  const [user, setUser] = useState<User | null>(apiService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.login({ email, password });
      setUser(response.user);
      return response;
    } catch (error: any) {
      const errorMessage = apiService.handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.register({ email, name, password });
      setUser(response.user);
      return response;
    } catch (error: any) {
      const errorMessage = apiService.handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiService.getCurrentUserInfo();
      setUser(userData);
      return userData;
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // Don't set error here as it might be called periodically
      return null;
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user && apiService.isAuthenticated(),
  };
}

// Characters hooks
export function useCharacters(): ApiListState<VirtualCharacter> {
  return useApiCall(
    () => apiService.getCharacters(),
    []
  ) as ApiListState<VirtualCharacter>;
}

export function useCharactersByProgram(programType: string): ApiListState<VirtualCharacter> {
  return useApiCall(
    () => apiService.getCharactersByProgram(programType),
    [programType]
  ) as ApiListState<VirtualCharacter>;
}

export function useProgramCharacterStats(programType: string): ApiState<any> {
  return useApiCall(
    () => apiService.getProgramCharacterStats(programType),
    [programType]
  );
}

// Admin hooks
export function useAdminStats(): ApiState<any> {
  return useApiCall(
    () => apiService.getAdminStats(),
    []
  );
}

export function useSystemHealth(): ApiState<any> {
  return useApiCall(
    () => apiService.getSystemHealth(),
    []
  );
}

export function useApiUsage(): ApiState<any> {
  return useApiCall(
    () => apiService.getApiUsage(),
    []
  );
}

export function useApiEndpoints(): ApiState<any> {
  return useApiCall(
    () => apiService.getApiEndpoints(),
    []
  );
}

// System Settings hooks
export function useSystemSettings(): ApiState<any> {
  return useApiCall(
    () => apiService.getSystemSettings(),
    []
  );
}

export function useSystemLogs(limit: number = 100): ApiState<any> {
  return useApiCall(
    () => apiService.getSystemLogs(limit),
    [limit]
  );
}

export function useCharacter(characterId: string | null): ApiState<VirtualCharacter> {
  return useApiCall(
    () => characterId ? apiService.getCharacter(characterId) : Promise.resolve(null),
    [characterId]
  );
}

// Sessions hooks
export function useSessions(): ApiListState<TrainingSession> {
  return useApiCall(
    () => apiService.getUserSessions(),
    []
  ) as ApiListState<TrainingSession>;
}

export function useSession(sessionId: string | null): ApiState<TrainingSession> {
  return useApiCall(
    () => sessionId ? apiService.getSession(sessionId) : Promise.resolve(null),
    [sessionId]
  );
}

// Session management hook
export function useSessionManager() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (programId: string, characterId: string) => {
    try {
      setCreating(true);
      setError(null);
      const session = await apiService.createSession({ program_id: programId, character_id: characterId });
      return session;
    } catch (error: any) {
      const errorMessage = apiService.handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, []);

  const addMessage = useCallback(async (sessionId: string, content: string, sender: 'user' | 'character') => {
    try {
      setError(null);
      const result = await apiService.addMessage(sessionId, {
        sender,
        content,
        message_type: 'text',
      });
      return result;
    } catch (error: any) {
      const errorMessage = apiService.handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    createSession,
    addMessage,
    creating,
    error,
  };
}

// WebSocket hook for real-time communication
export function useWebSocket(sessionId: string | null) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const websocket = apiService.createWebSocket(sessionId);
    
    websocket.onopen = () => {
      setConnected(true);
      setWs(websocket);
    };

    websocket.onclose = () => {
      setConnected(false);
      setWs(null);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    return () => {
      websocket.close();
    };
  }, [sessionId]);

  const sendMessage = useCallback((message: any) => {
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  }, [ws, connected]);

  return {
    connected,
    messages,
    sendMessage,
  };
}

// Health check hook
export function useHealthCheck() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      setChecking(true);
      await apiService.healthCheck();
      setHealthy(true);
    } catch (error) {
      setHealthy(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    healthy,
    checking,
    checkHealth,
  };
}

// Audio hooks (for future implementation)
export function useAudioRecording() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      
      return recorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      mediaRecorder.ondataavailable = (event) => {
        resolve(event.data);
      };

      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);

      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }, [mediaRecorder]);

  return {
    recording,
    startRecording,
    stopRecording,
  };
}