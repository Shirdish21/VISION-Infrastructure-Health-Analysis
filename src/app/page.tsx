
"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import DashboardOverview from "@/components/dashboard-overview";
import AssetList from "@/components/asset-list";
import AddAssetForm from "@/components/add-asset-form";
import IssueReporting from "@/components/issue-reporting";
import ReportedIssues from "@/components/reported-issues";
import HealthMonitoring from "@/components/health-monitoring";
import AlertsList from "@/components/alerts-list";
import HealthAnalytics from "@/components/health-analytics";
import HealthSimulator from "@/components/health-simulator";
import ElectricGrid from "@/components/electric-grid";
import CapacityUsageComparison from "@/components/capacity-usage-comparison";
import HistoricalDataAnalysis from "@/components/historical-data-analysis";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X, ShieldCheck, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FilterState } from "@/lib/definitions";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-muted animate-pulse rounded-xl flex items-center justify-center border-2 border-dashed border-primary/20">
      <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Initializing Geographic Intelligence...</p>
    </div>
  ),
});

export default function Home() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    status: "all",
    zone: "all",
    date: undefined
  });

  const resetFilters = () => {
    setFilters({ type: "all", status: "all", zone: "all", date: undefined });
  };

  const isFiltered = filters.type !== "all" || filters.status !== "all" || filters.zone !== "all" || filters.date;

  return (
    <SidebarProvider>
      <HealthSimulator />
      <AppSidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="outline" className="flex w-fit items-center gap-1.5 bg-primary/5 text-primary border-primary/20 px-2 py-0.5 rounded-full mb-1">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">VISION – Infrastructure Health Intelligence</span>
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight capitalize">
                {currentTab === 'dashboard' ? 'Infrastructure Health Monitoring System' : currentTab.replace('-', ' ')}
              </h2>
              <p className="text-muted-foreground">
                Automated urban surveillance, anomaly detection, and predictive risk scoring.
              </p>
            </div>

            {/* Filter Panel */}
            {(currentTab === 'dashboard' || currentTab === 'assets' || currentTab === 'health') && (
              <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">
                  <Filter className="h-3 w-3" /> Filters
                </div>
                
                <Select value={filters.type} onValueChange={(v) => setFilters(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Road">Roads</SelectItem>
                    <SelectItem value="Bridge">Bridges</SelectItem>
                    <SelectItem value="Pipeline">Pipelines</SelectItem>
                    <SelectItem value="Streetlight">Streetlights</SelectItem>
                    <SelectItem value="Transformer">Transformers</SelectItem>
                    <SelectItem value="Substation">Substations</SelectItem>
                    <SelectItem value="Power Line">Power Lines</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
                    <SelectValue placeholder="Health" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="Optimal">Optimal</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.zone} onValueChange={(v) => setFilters(f => ({ ...f, zone: v }))}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    <SelectItem value="North Sector">North Sector</SelectItem>
                    <SelectItem value="South Sector">South Sector</SelectItem>
                    <SelectItem value="Central">Central</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.date || ""}
                    onChange={(e) => setFilters(f => ({ ...f, date: e.target.value || undefined }))}
                    className="w-[140px] h-9 text-xs bg-background"
                  />
                </div>

                {isFiltered && (
                  <Button variant="ghost" size="icon" onClick={resetFilters} className="h-9 w-9 text-rose-500">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <Tabs value={currentTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-8 outline-none">
              <DashboardOverview filters={filters} />
              <div className="grid gap-8 lg:grid-cols-2">
                 <AlertsList limit={5} />
                 <ReportedIssues limit={5} />
              </div>
            </TabsContent>

            <TabsContent value="assets" className="outline-none">
              <AssetList filters={filters} />
            </TabsContent>

            <TabsContent value="health" className="outline-none">
              <HealthMonitoring filters={filters} />
            </TabsContent>

            <TabsContent value="alerts" className="outline-none">
              <AlertsList />
            </TabsContent>

            <TabsContent value="analytics" className="outline-none space-y-8">
              <HealthAnalytics />
              <CapacityUsageComparison />
              <HistoricalDataAnalysis />
            </TabsContent>

            <TabsContent value="electric" className="outline-none">
              <ElectricGrid />
            </TabsContent>

            <TabsContent value="add" className="max-w-2xl mx-auto outline-none">
              <AddAssetForm />
            </TabsContent>

            <TabsContent value="map" className="outline-none">
              <MapView />
            </TabsContent>

            <TabsContent value="report" className="max-w-2xl mx-auto outline-none">
              <IssueReporting />
            </TabsContent>

            <TabsContent value="issues" className="outline-none">
              <ReportedIssues />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
