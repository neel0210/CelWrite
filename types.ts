
export enum TaskType {
  EMAIL = 'EMAIL',
  SURVEY = 'SURVEY'
}

export interface Question {
  id: string;
  type: TaskType;
  title: string;
  prompt: string;
  wordCount: { min: number; max: number };
  timeLimit: number; // in minutes
  context?: string;
  options?: string[]; // for survey tasks
  guidelines?: string[]; // What to include in the response
}

export interface ExamState {
  currentQuestion: Question | null;
  userResponse: string;
  timeLeft: number; // in seconds
  isActive: boolean;
  isFinished: boolean;
  isEvaluating: boolean;
  feedback: EvaluationResult | null;
}

export interface VocabularyReplacement {
  original: string;
  replacement: string;
  reason: string;
}

export interface EvaluationResult {
  bandScore: number;
  sections: {
    taskAchievement: string;
    coherenceAndCohesion: string;
    vocabularyRange: string;
    grammarAccuracy: string;
    toneAndFormality: string;
  };
  suggestions: string[];
  vocabularyReplacements: VocabularyReplacement[];
  sampleModelResponse: string;
  annotatedResponse?: string;
}

export enum AppView {
  LANDING = 'LANDING',
  TASK_SELECTOR = 'TASK_SELECTOR',
  EXAM = 'EXAM',
  EVALUATION = 'EVALUATION',
  CUSTOM_CREATOR = 'CUSTOM_CREATOR'
}
