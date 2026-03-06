
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Bell,
  Activity,
  Zap,
  ArrowUpRight
} from "lucide-react";
import type { DashboardStats } from "@/lib/definitions";

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalAssets: docs.length,
        healthy: docs.filter(d => d.healthScore >= 80).length,
        warning: docs.filter(d => d.healthScore >= 50 && d.healthScore < 80).length,
        critical: docs.filter(d => d.healthScore < 50).length,
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
  }, []);

  const cards = [
    { title: "Network Scale", value: stats.totalAssets, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Optimal Health", value: stats.healthy, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Caution State", value: stats.warning, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Critical Failures", value: stats.critical, icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { title: "Health Alerts", value: stats.activeAlerts, icon: Bell, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 animate-in-fade">
      {cards.map((card) => (
        <Card key={card.title} className={`card-hover border-2 ${card.border} shadow-sm group hover:scale-[1.03] card-glow`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className={`p-2 rounded-lg ${card.bg} group-hover:scale-110 transition-transform`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
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
