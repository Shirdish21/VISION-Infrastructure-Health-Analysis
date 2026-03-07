"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import type { InfrastructureAsset } from "@/lib/definitions";

export default function CapacityUsageComparison() {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset)));
    });
    return unsub;
  }, []);

  const assetsWithUtilization = assets
    .filter(asset => asset.capacity && asset.usage !== undefined)
    .map(asset => {
      const utilization = ((asset.usage || 0) / (asset.capacity || 1)) * 100;
      const remaining = 100 - utilization;
      return {
        ...asset,
        utilization: Math.round(utilization),
        remaining: Math.round(remaining),
        usageValue: asset.usage || 0,
        capacityValue: asset.capacity || 0
      };
    })
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 10); // Top 10 by utilization

  const overloadedAssets = assetsWithUtilization.filter(a => a.utilization > 95);
  const underutilizedAssets = assetsWithUtilization.filter(a => a.utilization < 10);
  const averageUtilization = assetsWithUtilization.length > 0
    ? Math.round(assetsWithUtilization.reduce((sum, a) => sum + a.utilization, 0) / assetsWithUtilization.length)
    : 0;

  const chartData = assetsWithUtilization.map(asset => ({
    name: asset.name.length > 15 ? asset.name.substring(0, 15) + '...' : asset.name,
    usage: asset.usageValue,
    capacity: asset.capacityValue,
    utilization: asset.utilization,
    type: asset.type
  }));

  const getColor = (utilization: number) => {
    if (utilization > 95) return '#ef4444'; // Red
    if (utilization > 80) return '#f59e0b'; // Amber
    if (utilization > 50) return '#3b82f6'; // Blue
    return '#10b981'; // Green
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tighter">Average Utilization</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-500">{averageUtilization}%</div>
            <Progress value={averageUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tighter">Overloaded Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-500">{overloadedAssets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Operating above 95% capacity</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tighter">Underutilized Assets</CardTitle>
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500">{underutilizedAssets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Operating below 10% capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-none shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Capacity vs Usage Analysis
          </CardTitle>
          <CardDescription>Top 10 assets by utilization rate</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'utilization') return [`${value}%`, 'Utilization'];
                  return [value.toLocaleString(), name === 'usage' ? 'Current Usage' : 'Capacity'];
                }}
              />
              <Legend />
              <Bar dataKey="capacity" fill="#3b82f6" name="Capacity" opacity={0.3} />
              <Bar dataKey="usage" fill="#10b981" name="Current Usage">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.utilization)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card className="border-none shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Asset Utilization Details</CardTitle>
          <CardDescription>Capacity and usage breakdown by asset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assetsWithUtilization.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No assets with capacity data available.
            </div>
          ) : (
            assetsWithUtilization.map((asset) => (
              <div key={asset.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-sm">{asset.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-tighter mt-1">{asset.type} • {asset.zone}</p>
                  </div>
                  <Badge 
                    variant={asset.utilization > 95 ? 'destructive' : asset.utilization > 80 ? 'default' : 'secondary'}
                    className="text-[10px] font-black uppercase"
                  >
                    {asset.utilization > 95 && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {asset.utilization}% Used
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-bold uppercase">Usage</span>
                    <span className="font-bold">{asset.usageValue.toLocaleString()} / {asset.capacityValue.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={asset.utilization} 
                    className={`h-2 ${
                      asset.utilization > 95 
                        ? '[&>div]:bg-rose-500' 
                        : asset.utilization > 80 
                        ? '[&>div]:bg-amber-500' 
                        : '[&>div]:bg-blue-500'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Remaining: {asset.capacityValue - asset.usageValue} units</span>
                    <span>Available: {asset.remaining}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

