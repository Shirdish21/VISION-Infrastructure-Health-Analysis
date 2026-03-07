
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Gauge, Activity, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import type { InfrastructureAsset, FilterState } from "@/lib/definitions";

interface HealthMonitoringProps {
  filters: FilterState;
}

export default function HealthMonitoring({ filters }: HealthMonitoringProps) {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);

  useEffect(() => {
    const q = query(collection(db, "infrastructure"), orderBy("healthScore", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset));
      
      const filtered = docs.filter(asset => {
        const typeMatch = filters.type === 'all' || asset.type === filters.type;
        const statusMatch = filters.status === 'all' || asset.healthStatus === filters.status;
        const zoneMatch = filters.zone === 'all' || asset.zone === filters.zone;
        
        // Date filtering
        let dateMatch = true;
        if (filters.date && asset.createdAt) {
          const assetDate = asset.createdAt?.toDate ? asset.createdAt.toDate() : new Date(asset.createdAt);
          const filterDate = new Date(filters.date);
          dateMatch = assetDate.toDateString() === filterDate.toDateString();
        }
        
        return typeMatch && statusMatch && zoneMatch && dateMatch;
      });

      setAssets(filtered);
    });
    return unsub;
  }, [filters]);

  const getHealthBadge = (score: number) => {
    // 80-100: Optimal, 60-79: Standard, 30-59: Warning, 0-29: Critical
    if (score >= 80) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black">OPTIMAL</Badge>;
    if (score >= 60) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black">STANDARD</Badge>;
    if (score >= 30) return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black">WARNING</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black">CRITICAL</Badge>;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in-fade">
      {assets.length === 0 ? (
        <div className="col-span-full py-20 text-center space-y-4">
          <Activity className="h-12 w-12 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">No assets match the active intelligence filters.</p>
        </div>
      ) : (
        assets.map((asset) => {
          const utilization = asset.capacity ? (asset.usage! / asset.capacity!) * 100 : 0;
          
          return (
            <Card key={asset.id} className={`border-2 transition-all duration-500 ${asset.healthScore < 30 ? 'border-rose-500/30 ring-4 ring-rose-500/5 shadow-rose-500/10' : asset.healthScore < 60 ? 'border-amber-500/20 shadow-amber-500/5' : asset.healthScore < 80 ? 'border-blue-500/20 shadow-blue-500/5' : 'border-emerald-500/20 shadow-emerald-500/5'} card-glow group overflow-hidden`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{asset.name}</CardTitle>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <span className="bg-muted px-1.5 py-0.5 rounded">{asset.type}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {asset.zone}</span>
                    </div>
                  </div>
                  {getHealthBadge(asset.healthScore)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <Thermometer className="h-3 w-3" /> Core Temp
                    </div>
                    <div className={`text-xl font-black ${asset.temperature && asset.temperature > 80 ? 'text-rose-500' : ''}`}>
                      {asset.temperature?.toFixed(1) || '--'}°C
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <Gauge className="h-3 w-3" /> Pressure
                    </div>
                    <div className={`text-xl font-black ${asset.pressure && asset.pressure > 90 ? 'text-amber-500' : ''}`}>
                      {asset.pressure?.toFixed(1) || '--'} PSI
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <Activity className="h-3 w-3" /> Operational Utilization
                    </div>
                    <span className={`text-xs font-black ${utilization > 95 ? 'text-rose-500' : ''}`}>
                      {utilization.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={utilization} 
                    className={`h-1.5 ${utilization > 95 ? '[&>div]:bg-rose-500' : ''}`} 
                  />
                </div>

                <div className="pt-4 border-t border-dashed border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Health Intelligence Index</span>
                    <span className={`text-3xl font-black tracking-tighter ${asset.healthScore < 30 ? 'text-rose-500' : asset.healthScore < 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {asset.healthScore}%
                    </span>
                  </div>
                  {asset.healthScore < 30 ? (
                    <div className="flex items-center gap-1.5 text-rose-500 animate-pulse bg-rose-500/10 px-3 py-1 rounded-full">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Immediate Response</span>
                    </div>
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500/30" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
