// src/types/index.ts

// Base interface with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BuildUpdate extends BaseEntity {
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
  // Additional fields for better tracking
  blockers?: string[];
  dependencies?: string[];
  percentComplete?: number; // 0-100
}

export interface ScreenCapture extends BaseEntity {
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
  // Additional fields for better organization
  width?: number;
  height?: number;
  fileSize?: number; // in bytes
  format?: 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp';
  isPublic?: boolean;
  altText?: string;
  order?: number; // for ordering in gallery
}

export interface TechnicalMilestone extends BaseEntity {
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
    loadTime?: number;
    errorRate?: number;
  };
  // Additional fields
  priority: 'high' | 'medium' | 'low';
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string;
  tags?: string[];
}

export interface GlazeMeSpecs {
  name: string;
  concept: string;
  coreFeature: string;
  colorTheme: {
    primary: string;
    secondary: string;
    gradient: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  platform: string;
  targetFeatures: string[];
  technicalStack: {
    frontend: string[];
    backend: string[];
    ai: string[];
    database: string[];
    hosting: string[];
    testing?: string[];
    devOps?: string[];
  };
  // Additional fields
  version: string;
  lastUpdated: Date;
  contributors: string[];
  roadmap: {
    q1: string[];
    q2: string[];
    q3: string[];
    q4: string[];
  };
}

export interface CodeCommit extends BaseEntity {
  timestamp: Date;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
  author: string;
  branch: string;
  // Additional fields
  repository?: string;
  prNumber?: number;
  reviewedBy?: string[];
  isMergeCommit?: boolean;
  tags?: string[];
}

export interface AIPromptMetric extends BaseEntity {
  timestamp: Date;
  promptType: string;
  responseTime: number; // in milliseconds
  tokensUsed: number;
  success: boolean;
  errorType?: string;
  // Additional fields
  model?: string;
  temperature?: number;
  maxTokens?: number;
  cost?: number; // in USD
  userId?: string;
  sessionId?: string;
  feedback?: 'positive' | 'negative' | 'neutral';
}

// New types for enhanced functionality

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'editor' | 'viewer';
  lastActive?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  expiresAt?: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'upload' | 'download';
  entityType: 'buildUpdate' | 'screenCapture' | 'technicalMilestone' | 'codeCommit' | 'aiPrompt';
  entityId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface Comment {
  id: string;
  userId: string;
  entityType: 'buildUpdate' | 'screenCapture' | 'technicalMilestone';
  entityId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // for threaded comments
  likes: number;
  likedBy: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  createdAt: Date;
}

export interface Analytics {
  id: string;
  date: Date;
  metrics: {
    totalCommits: number;
    totalScreens: number;
    totalUpdates: number;
    totalMilestones: number;
    activeUsers: number;
    averageResponseTime: number;
    totalTokensUsed: number;
    totalCost: number;
  };
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface ExportData {
  version: string;
  exportedAt: Date;
  exportedBy: string;
  data: {
    builds: BuildUpdate[];
    screens: ScreenCapture[];
    milestones: TechnicalMilestone[];
    commits: CodeCommit[];
    prompts: AIPromptMetric[];
  };
}

// Utility types
export type EntityType = 
  | 'buildUpdate' 
  | 'screenCapture' 
  | 'technicalMilestone' 
  | 'codeCommit' 
  | 'aiPrompt';

export type Status = 'completed' | 'in-progress' | 'planned' | 'blocked';
export type Priority = 'high' | 'medium' | 'low';
export type Category = 'development' | 'design' | 'ai-integration' | 'testing' | 'deployment' | 'backend' | 'security';

// Form types for creating/updating entities
export interface CreateBuildUpdateInput {
  date: Date;
  weekNumber: number;
  title: string;
  description: string;
  category: Category;
  status: Status;
  priority: Priority;
  timeSpent: number;
  commitHash?: string;
  branch?: string;
  completedBy?: string;
  blockers?: string[];
  dependencies?: string[];
  percentComplete?: number;
}

export interface CreateScreenCaptureInput {
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
  width?: number;
  height?: number;
  fileSize?: number;
  format?: 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp';
  isPublic?: boolean;
  altText?: string;
  order?: number;
}

export interface CreateTechnicalMilestoneInput {
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
    loadTime?: number;
    errorRate?: number;
  };
  priority: Priority;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string;
  tags?: string[];
}

export interface CreateCodeCommitInput {
  timestamp: Date;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
  author: string;
  branch: string;
  repository?: string;
  prNumber?: number;
  reviewedBy?: string[];
  isMergeCommit?: boolean;
  tags?: string[];
}

export interface CreateAIPromptMetricInput {
  timestamp: Date;
  promptType: string;
  responseTime: number;
  tokensUsed: number;
  success: boolean;
  errorType?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  cost?: number;
  userId?: string;
  sessionId?: string;
  feedback?: 'positive' | 'negative' | 'neutral';
}

// Filter and sort types
export interface FilterOptions {
  status?: Status[];
  priority?: Priority[];
  category?: Category[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  tags?: string[];
  assignedTo?: string[];
}

export interface SortOptions {
  field: keyof BuildUpdate | keyof ScreenCapture | keyof TechnicalMilestone | 'date' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

// Response types for API calls
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalBuilds: number;
  totalScreens: number;
  totalCommits: number;
  totalPrompts: number;
  activeMilestones: number;
  completedThisWeek: number;
  inProgressCount: number;
  blockedCount: number;
  recentActivity: ActivityLog[];
  upcomingDeadlines: TechnicalMilestone[];
  performanceData: {
    dates: string[];
    commits: number[];
    screens: number[];
    updates: number[];
  };
}