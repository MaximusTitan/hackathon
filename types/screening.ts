export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-based)
  points: number;
}

export interface ScreeningTest {
  id: string;
  event_id: string;
  title?: string;
  instructions: string;
  deadline: string | null;
  timer_minutes: number;
  total_questions: number;
  passing_score: number;
  questions: MCQQuestion[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserTestAttempt {
  id: string;
  user_id: string;
  screening_test_id: string;
  registration_id: string;
  event_id: string;
  started_at: string;
  submitted_at: string | null;
  answers: Record<string, number> | null; // questionId -> selectedOptionIndex
  score: number | null;
  total_questions: number | null;
  time_taken_seconds: number | null;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'timeout';
  tab_switches: number;
  created_at: string;
  updated_at: string;
}

export interface TestInstructions {
  title: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  rules: string[];
}
