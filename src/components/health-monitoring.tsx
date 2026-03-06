
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Gauge, Activity, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import type { InfrastructureAsset } from "@/lib/definitions";

export default function HealthMonitoring() {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);

  useEffect(() => {
    const q = query(collection(db, "infrastructure"), orderBy("healthScore", "asc"));
    return onSnapshot(q, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset)));
    });
  }, []);

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-emerald-500 text-white border-none">HEALTHY</Badge>;
    if (score >= 50) return <Badge className="bg-amber-500 text-white border-none">WARNING</Badge>;
    return <Badge className="bg-rose-500 text-white border-none">CRITICAL</Badge>;
  };

  const getUtilizationColor = (util: number) => {
    if (util > 90) return "bg-rose-500";
    if (util > 70) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in-fade">
      {assets.map((asset) => {
        const utilization = asset.capacity ? (asset.usage! / asset.capacity!) * 100 : 0;
        
        return (
          <Card key={asset.id} className="border-none shadow-lg ring-1 ring-border card-glow group overflow-hidden">
            <div className={`h-1 w-full ${asset.healthScore < 50 ? 'bg-rose-500' : asset.healthScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <CardTitle className="text-lg font-bold">{asset.name}</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider">{asset.type}</CardDescription>
                </div>
                {getHealthBadge(asset.healthScore)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <Thermometer className="h-3 w-3" /> Temp
                  </div>
                  <div className="text-xl font-black">{asset.temperature?.toFixed(1) || '--'}°C</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <Gauge className="h-3 w-3" /> Pressure
                  </div>
                  <div className="text-xl font-black">{asset.pressure?.toFixed(1) || '--'} PSI</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <Activity className="h-3 w-3" /> Utilization
                  </div>
                  <span className={`text-xs font-black ${utilization > 90 ? 'text-rose-500' : ''}`}>
                    {utilization.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={utilization} 
                  className="h-1.5" 
                />
              </div>

              <div className="pt-4 border-t border-dashed flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Health Score</span>
                  <span className={`text-2xl font-black ${asset.healthScore < 50 ? 'text-rose-500' : ''}`}>
                    {asset.healthScore}%
                  </span>
                </div>
                {asset.healthScore < 50 ? (
                  <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Maintenance Required</span>
                  </div>
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500/30" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
