import { 
  QuizSession, 
  StudyStatistics, 
  GenrePerformance, 
  WeeklyProgress, 
  DailyActivity, 
  ProgressFilter 
} from '../types';
import { authService } from './auth';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'https://your-domain.com'}/api/progress`;

class ProgressService {
  private static instance: ProgressService;
  
  private constructor() {}
  
  static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authService.isAuthenticated()) {
      try {
        headers['Authorization'] = `Bearer ${authService.getAccessToken()}`;
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    return headers;
  }

  async saveQuizSession(sessionData: {
    session_type: string;
    genre: string;
    difficulty?: number;
    total_questions: number;
    answers: Array<{
      question_id: string;
      selected_choice_id: string;
      is_correct: boolean;
      response_time_seconds?: number;
    }>;
  }): Promise<QuizSession> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/sessions/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'セッションの保存に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving quiz session:', error);
      throw error;
    }
  }

  async getQuizSessions(filter?: ProgressFilter): Promise<QuizSession[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.genre) params.append('genre', filter.genre);
      if (filter?.date_from) params.append('date_from', filter.date_from);
      if (filter?.date_to) params.append('date_to', filter.date_to);
      if (filter?.limit) params.append('limit', filter.limit.toString());

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/sessions/?${params}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('セッション履歴の取得に失敗しました');
      }

      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Error fetching quiz sessions:', error);
      throw error;
    }
  }

  async getQuizSession(sessionId: string): Promise<QuizSession> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('セッション詳細の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz session:', error);
      throw error;
    }
  }

  async getStudyStatistics(): Promise<StudyStatistics> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/statistics/`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('学習統計の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching study statistics:', error);
      throw error;
    }
  }

  async getGenrePerformance(): Promise<GenrePerformance[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/genre-performance/`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('ジャンル別パフォーマンスの取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching genre performance:', error);
      throw error;
    }
  }

  async getWeeklyProgress(): Promise<WeeklyProgress[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/weekly-progress/`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('週別進捗の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      throw error;
    }
  }

  async getDailyActivity(): Promise<DailyActivity[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/daily-activity/`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('日別活動の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching daily activity:', error);
      throw error;
    }
  }

  async getUserAttempts(filter?: { genre?: string; is_correct?: boolean }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.genre) params.append('genre', filter.genre);
      if (filter?.is_correct !== undefined) params.append('is_correct', filter.is_correct.toString());

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/attempts/?${params}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('回答履歴の取得に失敗しました');
      }

      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      throw error;
    }
  }
}

export const progressService = ProgressService.getInstance();