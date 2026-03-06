
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, Legend
} from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";

export default function HealthAnalytics() {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [alertData, setAlertData] = useState<any[]>([]);
  const [utilizationData, setUtilizationData] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const assets = snapshot.docs.map(doc => doc.data());
      
      // Health Distribution
      const healthy = assets.filter(a => a.healthScore >= 80).length;
      const warning = assets.filter(a => a.healthScore >= 50 && a.healthScore < 80).length;
      const critical = assets.filter(a => a.healthScore < 50).length;
      setHealthData([
        { name: 'Optimal', value: healthy, color: '#10b981' },
        { name: 'Standard', value: warning, color: '#f59e0b' },
        { name: 'Critical', value: critical, color: '#ef4444' },
      ]);

      // Utilization trends (simulated by taking actual scores)
      setUtilizationData(assets.slice(0, 10).map((a, i) => ({
        name: a.name.split(' ')[0],
        usage: a.usage,
        capacity: a.capacity
      })));
    });

    const unsubAlerts = onSnapshot(collection(db, "alerts"), (snapshot) => {
      const alerts = snapshot.docs.map(doc => doc.data());
      const counts = alerts.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {});
      setAlertData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    });

    return () => {
      unsub();
      unsubAlerts();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Health Distribution */}
        <Card className="border-none shadow-xl ring-1 ring-border card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-primary" />
              Network Health Distribution
            </CardTitle>
            <CardDescription>Asset classification based on computed health metrics.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alert Frequency */}
        <Card className="border-none shadow-xl ring-1 ring-border card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-rose-500" />
              Anomaly Type Frequency
            </CardTitle>
            <CardDescription>Most common critical triggers in the last cycle.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertData}>
                <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Trends */}
      <Card className="border-none shadow-xl ring-1 ring-border card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Capacity vs. Current Load
          </CardTitle>
          <CardDescription>Comparative analysis of hardware utilization across sectors.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={utilizationData}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip 
                 contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="usage" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444' }} />
              <Line type="monotone" dataKey="capacity" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
