
"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import type { InfrastructureAsset, HealthStatus, AlertSeverity } from "@/lib/definitions";

export default function HealthSimulator() {
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const assets = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InfrastructureAsset));
      
      const interval = setInterval(async () => {
        if (assets.length === 0) return;

        // Pick random assets to simulate sensor updates
        const selected = assets.sort(() => 0.5 - Math.random()).slice(0, 3);

        for (const asset of selected) {
          if (!asset.id) continue;

          // Simulated IoT Values
          const newTemp = 50 + Math.random() * 50; // 50-100 C
          const newPressure = 30 + Math.random() * 80; // 30-110 PSI
          const newUsage = (asset.capacity || 1000) * (0.1 + Math.random() * 0.9);
          const maintenanceAge = asset.maintenanceAge || Math.floor(Math.random() * 500);
          
          // Rule-Based Health Scoring (Base 100)
          let riskFactors = 0;
          let anomalyDetected = false;
          let anomalyType = "";
          let severity: AlertSeverity = 'Warning';

          // Rule 1: Temperature
          if (newTemp > 85) {
            riskFactors += 25;
            anomalyDetected = true;
            anomalyType = "Thermal Overload";
            severity = 'Critical';
          }

          // Rule 2: Pressure
          if (newPressure > 90) {
            riskFactors += 20;
            anomalyDetected = true;
            anomalyType = "High Structural Pressure";
          }

          // Rule 3: Utilization
          const utilPercent = (newUsage / (asset.capacity || 1000)) * 100;
          if (utilPercent > 95) {
            riskFactors += 20;
            anomalyDetected = true;
            anomalyType = "Asset Overload";
            severity = 'Critical';
          }

          // Rule 4: Maintenance Age
          if (maintenanceAge > 365) {
            riskFactors += 15;
          }

          // Random degradation factor
          riskFactors += Math.random() * 10;

          const finalScore = Math.max(0, Math.floor(100 - riskFactors));
          
          let healthStatus: HealthStatus = 'Optimal';
          if (finalScore < 50) healthStatus = 'Critical';
          else if (finalScore < 80) healthStatus = 'Standard';

          // Update Asset in Firestore
          const assetRef = doc(db, "infrastructure", asset.id);
          updateDoc(assetRef, {
            temperature: newTemp,
            pressure: newPressure,
            usage: newUsage,
            healthScore: finalScore,
            healthStatus: healthStatus,
            isAbnormal: anomalyDetected,
            status: healthStatus === 'Critical' ? 'Critical' : healthStatus === 'Standard' ? 'Maintenance' : 'Operational',
            lastUpdated: serverTimestamp()
          });

          // Create Alert if anomaly detected
          if (anomalyDetected) {
            addDoc(collection(db, "alerts"), {
              assetId: asset.id,
              assetName: asset.name,
              type: anomalyType,
              severity: severity,
              description: `Automated detection: ${anomalyType} identified at ${new Date().toLocaleTimeString()}. Measured: ${anomalyType === 'Thermal Overload' ? newTemp.toFixed(1) + '°C' : utilPercent.toFixed(0) + '% load'}.`,
              location: asset.location,
              timestamp: serverTimestamp()
            });
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    });

    return () => unsub();
  }, []);

  return null;
}
