
export type InfrastructureStatus = 'Operational' | 'Maintenance' | 'Critical';
export type InfrastructureType = 'Road' | 'Bridge' | 'Pipeline' | 'Streetlight' | 'Public Facility' | 'Transformer' | 'Substation' | 'Power Line';
export type HealthStatus = 'Optimal' | 'Standard' | 'Critical' | 'Normal' | 'Warning';
export type AlertSeverity = 'Warning' | 'Critical';

export interface InfrastructureAsset {
  id?: string;
  name: string;
  type: InfrastructureType;
  location: string;
  zone: string;
  status: InfrastructureStatus;
  healthScore: number;
  healthStatus: HealthStatus;
  lat?: number;
  lng?: number;
  temperature?: number;
  pressure?: number;
  usage?: number;
  capacity?: number;
  maintenanceAge?: number; // In days
  isAbnormal?: boolean;
  lastUpdated?: any;
  createdAt?: any;
  // Electric grid specific fields
  voltageLevel?: string;
  loadPercentage?: number;
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
  issueType: 'Pothole' | 'Broken Streetlight' | 'Water Leakage' | 'Road Damage' | 'Power Failure' | 'Traffic Congestion';
  description: string;
  location: string;
  date?: string; // ISO date string for when issue occurred
  status: 'Reported' | 'In Progress' | 'Resolved';
  createdAt?: any;
}

export type DashboardStats = {
  totalAssets: number;
  optimal: number;
  warning: number;
  critical: number;
  activeAlerts: number;
};

export type FilterState = {
  type: string;
  status: string;
  zone: string;
  date?: string; // ISO date string for filtering
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
}
