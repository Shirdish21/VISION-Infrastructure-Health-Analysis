import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import type { InfrastructureAsset, InfrastructureAlert, AlertSeverity } from "@/lib/definitions";

export interface AlertRule {
  condition: (asset: InfrastructureAsset) => boolean;
  type: string;
  severity: AlertSeverity;
  description: (asset: InfrastructureAsset) => string;
}

// Smart Alert Rules
export const alertRules: AlertRule[] = [
  // Critical Health Alerts
  {
    condition: (asset) => asset.healthScore < 30,
    type: "Critical Infrastructure Health",
    severity: "Critical",
    description: (asset) => `Asset health dropped to critical level: ${asset.healthScore}%. Immediate intervention required.`
  },
  {
    condition: (asset) => asset.healthScore >= 30 && asset.healthScore < 60,
    type: "Degraded Asset Status",
    severity: "Warning",
    description: (asset) => `Asset health degraded to ${asset.healthScore}%. Maintenance recommended.`
  },
  // Overload Detection
  {
    condition: (asset) => {
      if (!asset.capacity || !asset.usage) return false;
      const utilization = (asset.usage / asset.capacity) * 100;
      return utilization > 95;
    },
    type: "Overload Detection",
    severity: "Critical",
    description: (asset) => {
      const utilization = asset.capacity ? ((asset.usage || 0) / asset.capacity) * 100 : 0;
      return `Asset operating at ${utilization.toFixed(1)}% capacity. Risk of failure imminent.`
    }
  },
  // High Temperature Alert
  {
    condition: (asset) => (asset.temperature || 0) > 80,
    type: "High Temperature Alert",
    severity: "Warning",
    description: (asset) => `Temperature exceeded safe threshold: ${asset.temperature?.toFixed(1)}°C.`
  },
  // High Pressure Alert
  {
    condition: (asset) => (asset.pressure || 0) > 90 && asset.type !== "Transformer" && asset.type !== "Substation" && asset.type !== "Power Line",
    type: "High Pressure Alert",
    severity: "Warning",
    description: (asset) => `Pressure exceeded safe threshold: ${asset.pressure?.toFixed(1)} PSI.`
  },
  // Underutilization Detection
  {
    condition: (asset) => {
      if (!asset.capacity || !asset.usage) return false;
      const utilization = (asset.usage / asset.capacity) * 100;
      return utilization < 10 && asset.healthScore > 60;
    },
    type: "Underutilization Detection",
    severity: "Warning",
    description: (asset) => {
      const utilization = asset.capacity ? ((asset.usage || 0) / asset.capacity) * 100 : 0;
      return `Asset significantly underutilized at ${utilization.toFixed(1)}%. Resource optimization opportunity.`
    }
  },
  // Maintenance Age Alert
  {
    condition: (asset) => (asset.maintenanceAge || 0) > 365,
    type: "Maintenance Overdue",
    severity: "Warning",
    description: (asset) => `Asset has not been maintained for ${Math.floor((asset.maintenanceAge || 0) / 30)} months. Scheduled maintenance required.`
  }
];

export async function checkAndCreateAlerts(asset: InfrastructureAsset): Promise<void> {
  // Check if alerts already exist for this asset
  const existingAlertsQuery = query(
    collection(db, "alerts"),
    where("assetId", "==", asset.id)
  );
  const existingAlerts = await getDocs(existingAlertsQuery);
  const existingAlertTypes = new Set(existingAlerts.docs.map(doc => doc.data().type));

  // Check each rule
  for (const rule of alertRules) {
    if (rule.condition(asset) && !existingAlertTypes.has(rule.type)) {
      // Create new alert
      await addDoc(collection(db, "alerts"), {
        assetId: asset.id,
        assetName: asset.name,
        type: rule.type,
        severity: rule.severity,
        description: rule.description(asset),
        location: asset.location,
        timestamp: serverTimestamp()
      });
    }
  }
}

export async function createCustomAlert(
  assetId: string,
  assetName: string,
  type: string,
  severity: AlertSeverity,
  description: string,
  location: string
): Promise<void> {
  await addDoc(collection(db, "alerts"), {
    assetId,
    assetName,
    type,
    severity,
    description,
    location,
    timestamp: serverTimestamp()
  });
}

