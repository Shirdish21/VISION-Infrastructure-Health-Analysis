
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Battery, 
  Activity, 
  AlertCircle, 
  Thermometer, 
  ZapOff,
  Gauge,
  ArrowUpRight
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import type { InfrastructureAsset } from "@/lib/definitions";

export default function ElectricGrid() {
  const [electricAssets, setElectricAssets] = useState<InfrastructureAsset[]>([]);
  const [gridStats, setGridStats] = useState({
    totalTransformers: 0,
    activeSubstations: 0,
    gridLoad: 0,
    voltageStatus: "Stable",
    faultCount: 0
  });

  useEffect(() => {
    const q = query(
      collection(db, "infrastructure"), 
      where("type", "in", ["Transformer", "Substation", "Power Line"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset));
      setElectricAssets(assets);

      const transformers = assets.filter(a => a.type === 'Transformer');
      const substations = assets.filter(a => a.type === 'Substation');
      const faults = assets.filter(a => a.healthStatus === 'Critical').length;
      
      const avgLoad = transformers.length > 0 
        ? transformers.reduce((acc, curr) => acc + (curr.loadPercentage || 0), 0) / transformers.length 
        : 0;

      setGridStats({
        totalTransformers: transformers.length,
        activeSubstations: substations.length,
        gridLoad: Math.round(avgLoad),
        voltageStatus: avgLoad > 90 ? "Fluctuating" : "Stable",
        faultCount: faults
      });
    });

    return () => unsubscribe();
  }, []);

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">OPTIMAL</Badge>;
    if (score >= 60) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">NORMAL</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">WARNING</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">CRITICAL</Badge>;
  };

  // Simulated demand data
  const demandData = [
    { time: '00:00', load: 45, capacity: 100 },
    { time: '04:00', load: 38, capacity: 100 },
    { time: '08:00', load: 72, capacity: 100 },
    { time: '12:00', load: 88, capacity: 100 },
    { time: '16:00', load: 82, capacity: 100 },
    { time: '20:00', load: 94, capacity: 100 },
    { time: '23:59', load: 60, capacity: 100 },
  ];

  return (
    <div className="space-y-8 animate-in-fade">
      {/* Grid Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Transformers" value={gridStats.totalTransformers} Icon={Battery} color="text-blue-500" />
        <StatCard title="Active Substations" value={gridStats.activeSubstations} Icon={Activity} color="text-indigo-500" />
        <StatCard title="Grid Load Avg" value={`${gridStats.gridLoad}%`} Icon={Zap} color="text-amber-500" />
        <StatCard title="Voltage Stability" value={gridStats.voltageStatus} Icon={Gauge} color="text-emerald-500" />
        <StatCard title="Active Faults" value={gridStats.faultCount} Icon={ZapOff} color="text-rose-500" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Load Visualization */}
        <Card className="lg:col-span-2 border-none shadow-xl ring-1 ring-border card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Power Load vs. Capacity Trends
            </CardTitle>
            <CardDescription>Real-time city-wide electricity demand distribution (24h cycle).</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="load" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={3} />
                <Line type="monotone" dataKey="capacity" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts Specific to Grid */}
        <Card className="border-none shadow-xl ring-1 ring-border card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Active Grid Anomalies
            </CardTitle>
            <CardDescription>Recent high-voltage faults detected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {electricAssets.filter(a => a.healthStatus === 'Critical').length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground uppercase font-black tracking-widest opacity-40">
                Grid state optimal
              </div>
            ) : (
              electricAssets.filter(a => a.healthStatus === 'Critical').map(asset => (
                <div key={asset.id} className="p-3 bg-rose-500/5 border-l-4 border-rose-500 rounded-r-lg space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Fault: {asset.name}</p>
                  <p className="text-sm font-bold">Health Score: {asset.healthScore}%</p>
                  <div className="flex justify-between items-center text-[10px] text-rose-500 font-bold uppercase pt-1">
                    <span>Critical Voltage Drop</span>
                    <span>12:04 PM</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transformer Inventory */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {electricAssets.map((asset) => (
          <Card key={asset.id} className="border-none shadow-md ring-1 ring-border group hover:ring-primary/40 transition-all duration-500 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">{asset.name}</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">{asset.type} • {asset.location}</CardDescription>
                </div>
                {getHealthBadge(asset.healthScore)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <Zap className="h-3 w-3 text-amber-500" /> Voltage
                  </div>
                  <div className="text-lg font-black">{asset.voltageLevel || '11kV'}</div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <Thermometer className="h-3 w-3 text-rose-500" /> Temp
                  </div>
                  <div className="text-lg font-black">{asset.temperature?.toFixed(0)}°C</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-muted-foreground uppercase">Operational Load</span>
                  <span className={`text-xs font-black ${asset.loadPercentage && asset.loadPercentage > 90 ? 'text-rose-500' : ''}`}>
                    {asset.loadPercentage?.toFixed(0) || asset.usage?.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={asset.loadPercentage || asset.usage} 
                  className={`h-1.5 ${(asset.loadPercentage || asset.usage || 0) > 90 ? '[&>div]:bg-rose-500' : ''}`} 
                />
              </div>

              <div className="pt-3 border-t border-dashed flex items-center justify-between">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Grid Health Index</div>
                <div className="text-xl font-black text-primary">{asset.healthScore}%</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, Icon, color }: { title: string, value: any, Icon: any, color: string }) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-border card-glow transition-all hover:scale-[1.02]">
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className={`p-2 rounded-full ${color.replace('text', 'bg')}/10`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tighter">{value}</div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
