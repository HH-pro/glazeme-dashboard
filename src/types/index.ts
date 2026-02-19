// src/types/index.ts
export interface BuildUpdate {
  id: string;
  date: Date;
  weekNumber: number;
  title: string;
  description: string;
  category: 'development' | 'design' | 'ai-integration' | 'testing' | 'deployment' | 'backend' | 'security';
  status: 'completed' | 'in-progress' | 'planned' | 'blocked';
  priority: 'high' | 'medium' | 'low';
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