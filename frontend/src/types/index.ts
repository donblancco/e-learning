export interface Genre {
  id: string | number;
  name: string;
  description?: string;
  question_count?: number;
  created_at?: string;
}

export interface Choice {
  id: string;
  content: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  genre: string;
  genre_name: string;
  difficulty: number;
  difficulty_display: string;
  point_weight: number;
  time_weight: number;
  title: string;     // 旧bodyフィールド（問題のタイトル）
  body: string;      // 旧objectフィールド（実際の問題文）
  clarification: string;
  choices: Choice[];
  author_name: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at?: string | null;
  is_active: boolean;
}

export interface Answer {
  questionId: string;
  selectedAnswer: string;
  selectedChoiceId: string;
  isCorrect: boolean;
}

export interface QuizState {
  selectedGenre: Genre | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  isCompleted: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff?: boolean;
  date_joined: string;
  last_login?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface QuizSession {
  id: string;
  user?: string;
  genre?: string;
  genre_name?: string;
  session_type?: string;
  difficulty?: number;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  is_completed: boolean;
}

export interface StudyStatistics {
  total_sessions: number;
  total_questions: number;
  correct_answers: number;
  accuracy_rate: number;
  average_score: number;
  total_study_time: number; // 秒
  favorite_genre: Genre | null;
  recent_sessions: QuizSession[];
  genre_performance: GenrePerformance[];
}

export interface GenrePerformance {
  genre: Genre;
  sessions_count: number;
  questions_count: number;
  correct_answers: number;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  average_score: number;
  best_score: number;
  total_time: number;
  last_attempt: string;
}

export interface WeeklyProgress {
  week_start: string;
  sessions_count: number;
  questions_count: number;
  correct_answers: number;
  accuracy_rate: number;
  total_time: number;
}

export interface DailyActivity {
  date: string;
  sessions_count: number;
  questions_count: number;
  study_time: number;
}

export interface ProgressFilter {
  genre?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}