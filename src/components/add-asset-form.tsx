
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, MapPin, Gauge, ShieldCheck, Zap } from "lucide-react";
import type { InfrastructureAsset, HealthStatus, AlertSeverity } from "@/lib/definitions";

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground uppercase font-bold tracking-widest">Loading Map Interface...</div>
});

export default function AddAssetForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return; // Prevent double submission
    
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    setLoading(true);

    const type = formData.get("type") as string;
    const isElectric = ["Transformer", "Substation", "Power Line"].includes(type);

    // 1. Generate Stable Sensor Values
    const capacity = Number(formData.get("capacity")) || 1000;
    const temp = 20 + Math.random() * 80; // 20-100 C
    const pressure = isElectric ? 0 : 20 + Math.random() * 100; // 20-120 PSI
    const usage = capacity * (0.1 + Math.random() * 0.95);
    const maintenanceAge = Math.floor(Math.random() * 500);
    const voltageLevel = isElectric ? "11kV" : "";

    // 2. Rule-Based Health Calculation (v3.0 Improvements)
    let riskFactors = 0;
    if (temp > 80) riskFactors += 30;
    if (!isElectric && pressure > 90) riskFactors += 25;
    if ((usage / capacity) > 0.95) riskFactors += 25;
    if (maintenanceAge > 365) riskFactors += 20;

    const finalScore = Math.max(0, Math.min(100, 100 - riskFactors));
    
    // Classification: 80-100: Optimal, 60-79: Standard, 30-59: Warning, 0-29: Critical
    let healthStatus: HealthStatus = 'Optimal';
    if (finalScore < 30) healthStatus = 'Critical';
    else if (finalScore < 60) healthStatus = 'Warning';
    else if (finalScore < 80) healthStatus = 'Standard';

    const assetData: Omit<InfrastructureAsset, 'id'> = {
      name: formData.get("name") as string,
      type: type as any,
      location: formData.get("location") as string,
      zone: formData.get("zone") as string,
      status: healthStatus === 'Critical' ? 'Critical' : healthStatus === 'Warning' ? 'Maintenance' : 'Operational',
      healthStatus: healthStatus,
      capacity: capacity,
      usage: usage,
      temperature: temp,
      pressure: pressure,
      healthScore: finalScore,
      lat: coords?.lat || null as any,
      lng: coords?.lng || null as any,
      maintenanceAge: maintenanceAge,
      voltageLevel: voltageLevel,
      loadPercentage: Math.round((usage / capacity) * 100),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "infrastructure"), assetData);

      // 3. Alert Generation for Critical States
      if (finalScore < 30) {
        await addDoc(collection(db, "alerts"), {
          assetId: docRef.id,
          assetName: assetData.name,
          type: "Critical Infrastructure Health",
          severity: "Critical",
          description: `Asset registered with critical health index: ${finalScore}%. Immediate surveillance recommended.`,
          location: assetData.location,
          timestamp: serverTimestamp()
        });
      } else if (healthStatus === 'Warning') {
        await addDoc(collection(db, "alerts"), {
          assetId: docRef.id,
          assetName: assetData.name,
          type: "Degraded Asset Status",
          severity: "Warning",
          description: `Initial scan detected degraded health: ${finalScore}%.`,
          location: assetData.location,
          timestamp: serverTimestamp()
        });
      }

      toast({ 
        title: "Asset Onboarded Successfully", 
        description: `${assetData.name} synchronized with intelligence score ${finalScore}%.` 
      });
      // Reset form after successful submission
      form.reset();
      setCoords(null);
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Firestore error:", error);
      toast({ 
        variant: "destructive", 
        title: "Registration Failed", 
        description: "Integration error. Check connectivity." 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-none shadow-xl ring-1 ring-border overflow-hidden card-glow animate-in-fade">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 w-full" />
      <CardHeader className="pb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
           <ShieldCheck className="h-5 w-5" />
           <span className="text-xs font-bold uppercase tracking-widest">Stable Asset Onboarding</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Onboard New Urban Intelligence</CardTitle>
        <CardDescription>Register hardware with automated initial health calibration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Infrastructure Name</Label>
              <Input id="name" name="name" placeholder="e.g. Skyline Metro Bridge" required className="bg-muted/30 h-11 focus:ring-primary font-medium" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="type" className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Asset Classification</Label>
              <Select name="type" required>
                <SelectTrigger className="bg-muted/30 h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Bridge">Bridge</SelectItem>
                  <SelectItem value="Pipeline">Pipeline</SelectItem>
                  <SelectItem value="Streetlight">Streetlight</SelectItem>
                  <SelectItem value="Transformer">Transformer (Grid)</SelectItem>
                  <SelectItem value="Substation">Substation (Grid)</SelectItem>
                  <SelectItem value="Power Line">Power Line (Grid)</SelectItem>
                  <SelectItem value="Public Facility">Public Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="capacity" className="text-sm font-bold uppercase tracking-tighter text-muted-foreground flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" /> Max Design Capacity
              </Label>
              <Input id="capacity" name="capacity" type="number" placeholder="e.g. 5000" required className="bg-muted/30 h-11" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="zone" className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Intelligence Zone</Label>
              <Select name="zone" required>
                <SelectTrigger className="bg-muted/30 h-11">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North Sector">North Sector</SelectItem>
                  <SelectItem value="South Sector">South Sector</SelectItem>
                  <SelectItem value="Central">Central</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="location" className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Physical Vicinity</Label>
            <Input id="location" name="location" placeholder="e.g. Sector 4, Avenue 12" required className="bg-muted/30 h-11" />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Geographic Anchoring (Precise GPS)
            </Label>
            <LocationPicker onLocationSelect={(lat, lng) => setCoords({ lat, lng })} />
          </div>

          <div className="bg-muted/20 p-4 rounded-xl border border-dashed border-primary/20 text-xs text-muted-foreground leading-relaxed">
            Note: Sensors will be simulated based on urban risk models. Electricity assets use grid-specific evaluation.
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold btn-gradient" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Calibrating Sensors...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5" /> Synchronize Asset Intelligence
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
