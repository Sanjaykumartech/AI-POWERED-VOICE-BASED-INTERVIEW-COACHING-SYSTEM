export type InterviewCategory = "technical" | "management" | "general";

export type InterviewMode = "mock" | "company";

export type SessionStatus = "active" | "completed" | "paused";

export interface TopicPerformancePoint {
  date: string;
  score: number;
}

export interface TopicSnapshot {
  topic: string;
  proficiency: number;
  lastPracticedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  readinessScore: number;
  candidateProfileCompleted?: boolean;
  candidateDetails?: CandidateDetails;
  preferences: {
    preferredCategories: InterviewCategory[];
    targetCompanies: string[];
  };
}

export interface CandidateDetails {
  educationQualification: string;
  institution?: string;
  fieldOfStudy: string;
  stream?: string;
  department?: string;
  skills: string[];
  workExperience?: string;
  internshipRole?: string;
  experienceDuration?: string;
  preparingFor: string;
}

export interface InterviewInteraction {
  id: string;
  topic: string;
  question: string;
  answer: string;
  score: number;
  correctness: string;
  missingPoints: string[];
  conceptClarity: string;
  suggestedImprovements: string[];
  feedback: string;
  createdAt: string;
}

export interface InterviewSessionSummary {
  mistakes: string[];
  weakTopics: string[];
  strengths: string[];
  correctAnswers: string[];
  dos: string[];
  donts: string[];
  overallFeedback: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  mode: InterviewMode;
  role: string;
  company?: string;
  topics: string[];
  category: InterviewCategory;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  averageScore: number;
  adaptiveDifficulty: number;
  summary?: InterviewSessionSummary;
}

export interface ActivityCell {
  date: string;
  intensity: number;
  activeHours: number;
  sessionsCount: number;
  topicsStudied: string[];
  scores: number[];
  feedbackHighlights: string[];
}

export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  strongestTopic: string;
  weakestTopic: string;
}

export interface InsightCard {
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
}

export interface DashboardPayload {
  profile: UserProfile;
  stats: DashboardStats;
  readinessTrend: TopicPerformancePoint[];
  topicScores: TopicSnapshot[];
  heatmap: ActivityCell[];
  recentSessions: InterviewSession[];
  insights: InsightCard[];
}
