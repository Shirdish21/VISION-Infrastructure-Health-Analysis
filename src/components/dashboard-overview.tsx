
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Bell,
  Activity,
  Zap,
  ArrowUpRight
} from "lucide-react";
import type { DashboardStats, FilterState, InfrastructureAsset } from "@/lib/definitions";

interface DashboardOverviewProps {
  filters: FilterState;
}

export default function DashboardOverview({ filters }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    optimal: 0,
    warning: 0,
    critical: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as InfrastructureAsset);
      
      const filtered = docs.filter(asset => {
        const typeMatch = filters.type === 'all' || asset.type === filters.type;
        const statusMatch = filters.status === 'all' || asset.healthStatus === filters.status;
        const zoneMatch = filters.zone === 'all' || asset.zone === filters.zone;
        return typeMatch && statusMatch && zoneMatch;
      });

      // Classification: 80-100: Optimal, 60-79: Standard, 30-59: Warning, 0-29: Critical
      setStats(prev => ({
        ...prev,
        totalAssets: filtered.length,
        optimal: filtered.filter(d => d.healthScore >= 80).length,
        warning: filtered.filter(d => d.healthScore >= 30 && d.healthScore < 80).length,
        critical: filtered.filter(d => d.healthScore < 30).length,
      }));
    });

    const unsubAlerts = onSnapshot(collection(db, "alerts"), (snapshot) => {
      setStats(prev => ({
        ...prev,
        activeAlerts: snapshot.docs.length,
      }));
    });

    return () => {
      unsubAssets();
      unsubAlerts();
    };
  }, [filters]);

  const cards = [
    { title: "Network Scale", value: stats.totalAssets, Icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Optimal State", value: stats.optimal, Icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Standard Risk", value: stats.warning, Icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Critical Fail", value: stats.critical, Icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { title: "Health Alerts", value: stats.activeAlerts, Icon: Bell, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 animate-in-fade">
      {cards.map((card) => (
        <Card key={card.title} className={`border-2 ${card.border} shadow-sm group hover:scale-[1.03] card-glow transition-all duration-300`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className={`p-2 rounded-lg ${card.bg} group-hover:scale-110 transition-transform`}>
              <card.Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
              {card.value}
            </div>
            <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-[0.2em]">
              {card.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
