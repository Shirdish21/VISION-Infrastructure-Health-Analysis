
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Zap, ShieldAlert, Clock, MapPin } from "lucide-react";
import type { InfrastructureAlert } from "@/lib/definitions";

interface AlertsListProps {
  limit?: number;
}

export default function AlertsList({ limit }: AlertsListProps) {
  const [alerts, setAlerts] = useState<InfrastructureAlert[]>([]);

  useEffect(() => {
    let q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    if (limit) {
      q = query(q, firestoreLimit(limit));
    }
    
    return onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAlert)));
    });
  }, [limit]);

  return (
    <Card className="border-none shadow-sm ring-1 ring-border card-glow overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            Health Intelligence Alerts
          </CardTitle>
          <CardDescription>Automated anomaly detection log.</CardDescription>
        </div>
        <Bell className="h-5 w-5 text-muted-foreground/30" />
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
             <Zap className="h-8 w-8 text-muted-foreground/20" />
             No active anomalies detected in the network.
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border-l-4 relative group transition-all hover:translate-x-1 ${
                alert.severity === 'Critical' 
                ? 'bg-rose-500/5 border-rose-500' 
                : 'bg-amber-500/5 border-amber-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Asset: {alert.assetName}</span>
                  <h4 className="font-bold text-sm">{alert.type}</h4>
                </div>
                <Badge variant={alert.severity === 'Critical' ? 'destructive' : 'default'} className="text-[9px] font-black uppercase tracking-tighter px-2">
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {alert.description}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase">
                 <div className="flex items-center gap-1">
                   <MapPin className="h-3 w-3" /> {alert.location}
                 </div>
                 <div className="flex items-center gap-1">
                   <Clock className="h-3 w-3" /> 
                   {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleTimeString() : 'Recent'}
                 </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
