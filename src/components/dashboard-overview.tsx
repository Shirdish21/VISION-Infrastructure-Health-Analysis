"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  MessageSquare,
  ArrowUpRight
} from "lucide-react";
import type { DashboardStats } from "@/lib/definitions";

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    operational: 0,
    maintenance: 0,
    critical: 0,
    reportedIssues: 0,
  });

  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalAssets: docs.length,
        operational: docs.filter(d => d.status === 'Operational').length,
        maintenance: docs.filter(d => d.status === 'Maintenance').length,
        critical: docs.filter(d => d.status === 'Critical').length,
      }));
    });

    const unsubIssues = onSnapshot(collection(db, "issues"), (snapshot) => {
      setStats(prev => ({
        ...prev,
        reportedIssues: snapshot.docs.length,
      }));
    });

    return () => {
      unsubAssets();
      unsubIssues();
    };
  }, []);

  const cards = [
    { title: "Total Assets", value: stats.totalAssets, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Operational", value: stats.operational, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Maintenance", value: stats.maintenance, icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { title: "Reported Issues", value: stats.reportedIssues, icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
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