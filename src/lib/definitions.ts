
export type InfrastructureStatus = 'Operational' | 'Maintenance' | 'Critical';
export type InfrastructureType = 'Road' | 'Bridge' | 'Pipeline' | 'Streetlight' | 'Public Facility';

export interface InfrastructureAsset {
  id?: string;
  name: string;
  type: InfrastructureType;
  location: string;
  status: InfrastructureStatus;
  healthScore: number;
  lat?: number;
  lng?: number;
  createdAt?: any;
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
  operational: number;
  maintenance: number;
  critical: number;
  reportedIssues: number;
};
