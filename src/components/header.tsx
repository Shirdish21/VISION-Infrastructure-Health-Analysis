
"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-9 w-9" />
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden md:flex items-center gap-1.5 bg-primary/5 text-primary border-primary/20 px-2 py-1">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Health Intelligence v3.0</span>
          </Badge>
          <div className="hidden lg:block">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Infrastructure Intelligence Network
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background animate-pulse" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">Admin Console</p>
            <p className="text-xs text-muted-foreground mt-1">Smart City Dept</p>
          </div>
          <Avatar className="h-9 w-9 cursor-pointer border">
            <AvatarImage src="https://picsum.photos/seed/vision/100" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
