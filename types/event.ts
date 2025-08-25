export type Event = {
  id: string;
  title: string;
  description?: string | null;
  start_date: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  event_type: "virtual" | "offline" | null;
  event_category?: "hackathon" | "sales" | null;
  meeting_link?: string | null;
  location?: string | null;
  location_link?: string | null;
  venue_name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  image_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_public: boolean;
  date_tba?: boolean;
  time_tba?: boolean;
  venue_tba?: boolean;
  show_start_button?: boolean;
};

export interface MCQQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
}

export interface ScreeningTest {
  id: string;
  title?: string;
  instructions: string;
  timer_minutes?: number;
  passing_score?: number;
  total_questions?: number;
  questions?: MCQQuestion[];
  mcq_link?: string;
  deadline?: string;
  event_id: string;
  is_active: boolean;
}

export interface EventRegistration {
  id: string;
  registered_at: string;
  user_id: string;
  payment_id?: string | null;
  order_id?: string | null;
  amount_paid?: number | null;
  attended?: boolean;
  screening_status?: 'pending' | 'sent' | 'completed' | 'skipped';
  screening_test_id?: string | null;
  presentation_status?: 'pending' | 'submitted' | 'reviewed';
  qualification_status?: 'pending' | 'qualified' | 'rejected' | null;
  qualification_remarks?: string | null;
  qualified_at?: string | null;
  qualified_by?: string | null;
  github_link?: string | null;
  deployment_link?: string | null;
  presentation_link?: string | null;
  presentation_notes?: string | null;
  video_link?: string | null;
  sales_presentation_link?: string | null;
  award_type?: 'winner' | 'runner_up' | null;
  award_assigned_at?: string | null;
  admin_notes?: string | null;
  admin_score?: number | null;
  user: {
    name: string;
    email: string;
    linkedin: string | null;
  };
  screening_test?: {
    title: string;
    passing_score: number;
    timer_minutes: number;
    total_questions: number;
    mcq_link?: string;
    deadline?: string;
  } | null;
  test_attempt?: {
    id: string;
    started_at: string;
    submitted_at: string;
    score: number;
    total_questions: number;
    score_percentage: number;
    passed: boolean;
    time_taken_seconds: number;
    status: string;
    tab_switches: number;
  } | null;
  all_test_attempts?: Array<{
    id: string;
    started_at: string;
    submitted_at: string;
    score: number;
    total_questions: number;
    score_percentage: number;
    time_taken_seconds: number;
    status: string;
    tab_switches: number;
  }>;
  award_assigned_by_admin?: {
    name: string;
    email: string;
  } | null;
}
