
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Database, 
  PlusCircle, 
  AlertCircle, 
  History,
  Activity,
  Map as MapIcon,
  Bell,
  BarChart3,
  Stethoscope
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
}

export function AppSidebar({ currentTab, onTabChange }: AppSidebarProps) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assets", label: "Assets", icon: Database },
    { id: "health", label: "Health Monitoring", icon: Stethoscope },
    { id: "map", label: "Map View", icon: MapIcon },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "add", label: "Add Asset", icon: PlusCircle },
    { id: "report", label: "Report Issue", icon: AlertCircle },
    { id: "issues", label: "Issue Logs", icon: History },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-md">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
            VISION
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={currentTab === item.id}
                onClick={() => onTabChange(item.id)}
                tooltip={item.label}
                className="py-6 px-4"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
