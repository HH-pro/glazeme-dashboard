// src/types/index.ts

// Type aliases for BuildUpdate fields
export type UpdateCategory = 'development' | 'design' | 'ai-integration' | 'testing' | 'deployment' | 'backend' | 'security';
export type UpdateStatus = 'completed' | 'in-progress' | 'planned' | 'blocked';
export type UpdatePriority = 'high' | 'medium' | 'low';
export interface ClientReview {
  id: string;
  updateId: string;
  updateTitle: string;
  clientName: string;
  clientEmail: string;
  rating?: number;
  feedback: string;
  feedbackType: 'general' | 'bug' | 'feature-request' | 'design' | 'content';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'changes-requested' | 'in-review';
  attachments?: string[];
  createdAt: Date;
  reviewedAt?: Date;
  tags?: string[];
}

export interface BuildUpdate {
  id: string; // Changed from string to number to match component usage
  date: Date;
  
  weekNumber: number;
  title: string;
  description: string;
  category: UpdateCategory;
  status: UpdateStatus;
  priority: UpdatePriority;
  timeSpent: number; // in hours
  commitHash?: string;
  branch?: string;
  completedBy?: string;
}

export interface ScreenCapture {
  id: string;
  date: Date;
  screenName: string;
  imageUrl: string;
  cloudinaryId: string;
  description: string;
  buildVersion: string;
  componentName: string;
  filePath: string;
  lineCount?: number;
  dependencies?: string[];
  tags: string[];
}

export interface TechnicalMilestone {
  id: string;
  week: number;
  task: string;
  completed: boolean;
  notes: string;
  completedDate?: Date;
  prUrl?: string;
  issueNumber?: string;
  performanceMetrics?: {
    responseTime?: number;
    memoryUsage?: number;
    apiLatency?: number;
  };
}

export interface GlazeMeSpecs {
  name: string;
  concept: string;
  coreFeature: string;
  colorTheme: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  platform: string;
  targetFeatures: string[];
  technicalStack: {
    frontend: string[];
    backend: string[];
    ai: string[];
    database: string[];
    hosting: string[];
  };
}

export interface CodeCommit {
  id: string;
  timestamp: Date;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
  author: string;
  branch: string;
}

export interface AIPromptMetric {
  id: string;
  timestamp: Date;
  promptType: string;
  responseTime: number;
  tokensUsed: number;
  success: boolean;
  errorType?: string;
}

// Optional: Add some utility types or constants if needed
export const UPDATE_CATEGORIES: UpdateCategory[] = [
  'development',
  'design',
  'ai-integration',
  'testing',
  'deployment',
  'backend',
  'security'
];

export const UPDATE_STATUSES: UpdateStatus[] = [
  'completed',
  'in-progress',
  'planned',
  'blocked'
];

export const UPDATE_PRIORITIES: UpdatePriority[] = [
  'high',
  'medium',
  'low'
];