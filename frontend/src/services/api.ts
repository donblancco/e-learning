import { Genre, Question } from '../types';
import { authService } from './auth';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'https://your-domain.com'}/api/questions`;

export const api = {
  async getGenres(): Promise<Genre[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/genres/`);
      if (!response.ok) {
        throw new Error('Failed to fetch genres');
      }
      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  async getQuestions(): Promise<Question[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  async getRandomQuestions(genreId?: number, count: number = 10, difficulty?: number): Promise<Question[]> {
    try {
      const params = new URLSearchParams();
      if (genreId) {
        params.append('genre', genreId.toString());
      }
      params.append('count', count.toString());
      if (difficulty) {
        params.append('difficulty', difficulty.toString());
      }

      const headers: HeadersInit = {};
      
      // 認証が必要な場合はトークンを追加
      if (authService.isAuthenticated()) {
        try {
          headers['Authorization'] = `Bearer ${authService.getAccessToken()}`;
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch(`${API_BASE_URL}/questions/random/?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch random questions');
      }
      const data = await response.json();
      return data.questions || data;
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw error;
    }
  },

  async getRandomQuestionsFromAll(count: number = 30): Promise<Question[]> {
    try {
      const params = new URLSearchParams();
      params.append('count', count.toString());

      const headers: HeadersInit = {};
      
      // 認証が必要な場合はトークンを追加
      if (authService.isAuthenticated()) {
        try {
          headers['Authorization'] = `Bearer ${authService.getAccessToken()}`;
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch(`${API_BASE_URL}/questions/random/?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch random questions from all genres');
      }
      const data = await response.json();
      return data.questions || data;
    } catch (error) {
      console.error('Error fetching random questions from all genres:', error);
      throw error;
    }
  },

  async getIncorrectQuestions(genreId?: number, count: number = 10): Promise<Question[]> {
    try {
      const params = new URLSearchParams();
      if (genreId) {
        params.append('genre', genreId.toString());
      }
      params.append('limit', count.toString());

      const headers: HeadersInit = {};
      
      // 認証が必要
      if (authService.isAuthenticated()) {
        try {
          headers['Authorization'] = `Bearer ${authService.getAccessToken()}`;
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://your-domain.com'}/api/progress/incorrect-questions/?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch incorrect questions');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching incorrect questions:', error);
      throw error;
    }
  }
};