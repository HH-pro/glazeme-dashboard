// src/types/index.ts
export interface BuildUpdate {
  id: string;
  date: Date;
  weekNumber: number;
  title: string;
  description: string;
  category: 'development' | 'design' | 'ai-integration' | 'testing' | 'deployment';
  status: 'completed' | 'in-progress' | 'planned';
}

export interface ScreenCapture {
  id: string;
  date: Date;
  screenName: string;
  imageUrl: string;
  description: string;
  buildVersion: string;
}

export interface TechnicalMilestone {
  id: string;
  week: number;
  task: string;
  completed: boolean;
  notes: string;
  completedDate?: Date;
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
}