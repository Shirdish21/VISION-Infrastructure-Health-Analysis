
"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export default function HealthSimulator() {
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const assets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const interval = setInterval(async () => {
        // Pick 2 random assets to simulate sensor updates
        const shuffled = [...assets].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        for (const asset: any of selected) {
          const newTemp = 60 + Math.random() * 40; // 60-100 C
          const newPressure = 40 + Math.random() * 60; // 40-100 PSI
          const newUsage = (asset.capacity || 1000) * (0.3 + Math.random() * 0.7);
          
          // Rule Engine
          let healthPenalty = 0;
          let anomalyType = null;
          let severity: 'Warning' | 'Critical' = 'Warning';

          if (newTemp > 85) {
            healthPenalty += 40;
            anomalyType = "Thermal Overload";
            severity = 'Critical';
          }
          if (newUsage > (asset.capacity || 1000) * 0.95) {
            healthPenalty += 30;
            anomalyType = "Utilization Peak";
            severity = 'Critical';
          }
          if (newPressure > 90) {
            healthPenalty += 30;
            anomalyType = "Structural Pressure High";
            severity = 'Warning';
          }

          const newHealth = Math.max(0, 100 - healthPenalty - (Math.random() * 10));
          
          // Update Asset
          const assetRef = doc(db, "infrastructure", asset.id);
          updateDoc(assetRef, {
            temperature: newTemp,
            pressure: newPressure,
            usage: newUsage,
            healthScore: Math.floor(newHealth),
            isAbnormal: !!anomalyType,
            status: newHealth < 50 ? 'Critical' : newHealth < 80 ? 'Maintenance' : 'Operational'
          });

          // Create Alert if anomaly detected
          if (anomalyType) {
            addDoc(collection(db, "alerts"), {
              assetId: asset.id,
              assetName: asset.name,
              type: anomalyType,
              severity: severity,
              description: `Sensor threshold exceeded for ${asset.name}. Detected ${anomalyType} at ${new Date().toLocaleTimeString()}.`,
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

  return null; // Silent background simulator
}
