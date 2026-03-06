
"use client";

import { useState } from "react";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Dynamic import for the Map component
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

  return (
    <SidebarProvider>
      <HealthSimulator />
      <AppSidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight capitalize">
              {currentTab === 'dashboard' ? 'Health Monitoring System' : currentTab.replace('-', ' ')}
            </h2>
            <p className="text-muted-foreground">
              {currentTab === 'dashboard' && 'Real-time urban infrastructure health and anomaly surveillance.'}
              {currentTab === 'assets' && 'Detailed inventory and condition metrics of city hardware.'}
              {currentTab === 'health' && 'Live sensor telemetry and health score computation.'}
              {currentTab === 'alerts' && 'Automated system alerts and anomaly detections.'}
              {currentTab === 'analytics' && 'Macro-level infrastructure health and utilization trends.'}
              {currentTab === 'add' && 'Onboard new assets with design capacity metrics.'}
              {currentTab === 'report' && 'Citizen transmission channel for urban hazards.'}
              {currentTab === 'issues' && 'Chronological log of citizen reported incidents.'}
              {currentTab === 'map' && 'Geospatial health risk visualization and heatmaps.'}
            </p>
          </div>

          <Tabs value={currentTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-8 focus-visible:outline-none outline-none">
              <DashboardOverview />
              <div className="grid gap-8 lg:grid-cols-2">
                 <AlertsList limit={5} />
                 <ReportedIssues limit={5} />
              </div>
            </TabsContent>

            <TabsContent value="assets" className="focus-visible:outline-none outline-none">
              <AssetList />
            </TabsContent>

            <TabsContent value="health" className="focus-visible:outline-none outline-none">
              <HealthMonitoring />
            </TabsContent>

            <TabsContent value="alerts" className="focus-visible:outline-none outline-none">
              <AlertsList />
            </TabsContent>

            <TabsContent value="analytics" className="focus-visible:outline-none outline-none">
              <HealthAnalytics />
            </TabsContent>

            <TabsContent value="add" className="max-w-2xl mx-auto focus-visible:outline-none outline-none">
              <AddAssetForm />
            </TabsContent>

            <TabsContent value="map" className="focus-visible:outline-none outline-none">
              <MapView />
            </TabsContent>

            <TabsContent value="report" className="max-w-2xl mx-auto focus-visible:outline-none outline-none">
              <IssueReporting />
            </TabsContent>

            <TabsContent value="issues" className="focus-visible:outline-none outline-none">
              <ReportedIssues />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
