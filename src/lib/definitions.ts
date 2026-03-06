
export type InfrastructureStatus = 'Operational' | 'Maintenance' | 'Critical';
export type InfrastructureType = 'Road' | 'Bridge' | 'Pipeline' | 'Streetlight' | 'Public Facility';
export type AlertSeverity = 'Warning' | 'Critical';

export interface InfrastructureAsset {
  id?: string;
  name: string;
  type: InfrastructureType;
  location: string;
  status: InfrastructureStatus;
  healthScore: number;
  lat?: number;
  lng?: number;
  temperature?: number;
  pressure?: number;
  usage?: number;
  capacity?: number;
  isAbnormal?: boolean;
  lastMaintenance?: any;
  createdAt?: any;
}

export interface InfrastructureAlert {
  id?: string;
  assetId: string;
  assetName: string;
  type: string;
  severity: AlertSeverity;
  description: string;
  location: string;
  timestamp: any;
}

export interface InfrastructureIssue {
  id?: string;
  issueType: 'Pothole' | 'Broken Streetlight' | 'Water Leakage' | 'Road Damage';
  description: string;
  location: string;
  status: 'Reported' | 'In Progress' | 'Resolved';
  createdAt?: any;
}

export type DashboardStats = {
  totalAssets: number;
  healthy: number;
  warning: number;
  critical: number;
  activeAlerts: number;
};

// State types for legacy AI flows
export type AssistantState = {
  suggestion?: string;
  error?: string | {
    taskDescription?: string[];
  };
};

export type CalibrationState = {
  suggestion?: {
    suggestedSensitivityAdjustment: number;
    explanation: string;
  };
  error?: string | {
    sensitivityFeedback?: string[];
  };
};
