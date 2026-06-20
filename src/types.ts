export type JobStatus = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  salary?: string;
  jdUrl?: string;
  jdText?: string;
  appliedDate: string;
  notes?: string;
}

export interface ResumeTailorResult {
  atsScore: number;
  strengths: string[];
  missingKeywords: string[];
  improvementAreas: string[];
  tailoredBullets: string[];
  scoreReasoning?: string;
  missingTechnicalSkills?: string[];
  missingSoftSkills?: string[];
  missingCertifications?: string[];
  practicalRecommendations?: string[];
}

export interface CoverLetterResult {
  coverLetter: string;
}

export interface InterviewMessage {
  id: string;
  role: 'user' | 'model'; // 'user' = Candidate, 'model' = Interviewer AI
  text: string;
  feedback?: string;
  score?: number; // Score given for this specific answer (out of 10)
  strengths?: string[];
  improvements?: string[];
  exampleAnswerPoints?: string[];
  feedbackSummary?: string;
}

export interface InterviewSession {
  role: string;
  company: string;
  level: string;
  difficulty: "easy" | "medium" | "hard";
  interviewType: "behavioral" | "technical" | "coding" | "product";
  messages: InterviewMessage[];
  currentQuestion?: string;
  isStarted: boolean;
  isLoading: boolean;
  scoreHistory: number[]; // History of scores for each question
}

export interface SavedInterview {
  id: string;
  role: string;
  company: string;
  level: string;
  difficulty: "easy" | "medium" | "hard";
  interviewType: "behavioral" | "technical" | "coding" | "product";
  messages: InterviewMessage[];
  averageScore: number;
  createdAt: string;
}

export interface ResumeAnalyzerResult {
  match_score: number;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  resume_improvements: string[];
  tailored_bullets: string[];
}

export interface TabType {
  id: string;
  label: string;
  icon: string;
}
