"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Activity, AlertTriangle } from "lucide-react";
import type { InfrastructureAsset } from "@/lib/definitions";

interface HistoricalDataPoint {
  date: string;
  healthScore: number;
  utilization: number;
  temperature?: number;
  pressure?: number;
}

export default function HistoricalDataAnalysis() {
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset)));
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Simulate historical data based on current assets
    // In a real system, this would come from a time-series database
    const generateHistoricalData = () => {
      const days = parseInt(timeRange);
      const data: HistoricalDataPoint[] = [];
      const now = new Date();

      const targetAssets = selectedAsset === "all" 
        ? assets 
        : assets.filter(a => a.id === selectedAsset);

      if (targetAssets.length === 0) {
        setHistoricalData([]);
        return;
      }

      // Aggregate data for all assets or single asset
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (selectedAsset === "all") {
          // Aggregate across all assets
          const avgHealth = assets.length > 0
            ? assets.reduce((sum, a) => sum + a.healthScore, 0) / assets.length
            : 0;
          const avgUtilization = assets
            .filter(a => a.capacity && a.usage)
            .reduce((sum, a) => {
              const util = ((a.usage || 0) / (a.capacity || 1)) * 100;
              return sum + util;
            }, 0) / assets.filter(a => a.capacity && a.usage).length || 0;

          // Simulate historical variation
          const variation = (Math.random() - 0.5) * 10;
          data.push({
            date: dateStr,
            healthScore: Math.max(0, Math.min(100, avgHealth + variation)),
            utilization: Math.max(0, Math.min(100, avgUtilization + variation * 2)),
            temperature: assets.reduce((sum, a) => sum + (a.temperature || 0), 0) / assets.length || 0,
            pressure: assets
              .filter(a => a.pressure)
              .reduce((sum, a) => sum + (a.pressure || 0), 0) / assets.filter(a => a.pressure).length || 0
          });
        } else {
          // Single asset historical data
          const asset = targetAssets[0];
          const utilization = asset.capacity ? ((asset.usage || 0) / asset.capacity) * 100 : 0;
          const variation = (Math.random() - 0.5) * 10;
          
          data.push({
            date: dateStr,
            healthScore: Math.max(0, Math.min(100, asset.healthScore + variation)),
            utilization: Math.max(0, Math.min(100, utilization + variation * 2)),
            temperature: asset.temperature,
            pressure: asset.pressure
          });
        }
      }

      setHistoricalData(data);
    };

    generateHistoricalData();
  }, [assets, selectedAsset, timeRange]);

  const currentHealth = historicalData.length > 0 
    ? historicalData[historicalData.length - 1].healthScore 
    : 0;
  const previousHealth = historicalData.length > 1 
    ? historicalData[historicalData.length - 2].healthScore 
    : currentHealth;
  const healthTrend = currentHealth - previousHealth;

  const currentUtilization = historicalData.length > 0 
    ? historicalData[historicalData.length - 1].utilization 
    : 0;
  const previousUtilization = historicalData.length > 1 
    ? historicalData[historicalData.length - 2].utilization 
    : currentUtilization;
  const utilizationTrend = currentUtilization - previousUtilization;

  const selectedAssetData = selectedAsset !== "all" 
    ? assets.find(a => a.id === selectedAsset)
    : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-none shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historical Data Analysis
          </CardTitle>
          <CardDescription>Track infrastructure health and utilization trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets (Aggregate)</SelectItem>
                  {assets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id || ""}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Indicators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-tighter">Health Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-blue-500">{currentHealth.toFixed(1)}%</div>
                <div className="flex items-center gap-1 mt-2">
                  {healthTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                  )}
                  <span className={`text-xs font-bold ${healthTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {healthTrend >= 0 ? '+' : ''}{healthTrend.toFixed(1)}% from previous period
                  </span>
                </div>
              </div>
              {currentHealth < 30 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-tighter">Utilization Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-amber-500">{currentUtilization.toFixed(1)}%</div>
                <div className="flex items-center gap-1 mt-2">
                  {utilizationTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                  )}
                  <span className={`text-xs font-bold ${utilizationTrend >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {utilizationTrend >= 0 ? '+' : ''}{utilizationTrend.toFixed(1)}% from previous period
                  </span>
                </div>
              </div>
              {currentUtilization > 95 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overload
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Chart */}
      <Card className="border-none shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Health Score History
          </CardTitle>
          <CardDescription>
            {selectedAsset === "all" 
              ? "Average health score across all assets" 
              : `Health score for ${selectedAssetData?.name || 'selected asset'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Health Score']}
              />
              <Area 
                type="monotone" 
                dataKey="healthScore" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#healthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Utilization Chart */}
      <Card className="border-none shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Utilization History
          </CardTitle>
          <CardDescription>Capacity utilization trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="healthScore" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

