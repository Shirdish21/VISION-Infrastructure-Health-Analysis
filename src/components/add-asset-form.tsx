"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Loader2 } from "lucide-react";

export default function AddAssetForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(100);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const assetData = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as string,
      healthScore: healthScore,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "infrastructure"), assetData);
      toast({ 
        title: "Asset Registered", 
        description: `${assetData.name} has been successfully added to the system.` 
      });
      form.reset();
      setHealthScore(100);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Registration Failed", 
        description: "Integration error. Please check database connectivity." 
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
           <Plus className="h-5 w-5" />
           <span className="text-xs font-bold uppercase tracking-widest">Administrative Tool</span>
        </div>
        <CardTitle className="text-2xl font-bold">Register Infrastructure Asset</CardTitle>
        <CardDescription>Onboard a new city component into the intelligence network.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-bold">Infrastructure Name</Label>
              <Input id="name" name="name" placeholder="e.g. Skyline Metro Bridge" required className="bg-muted/30 h-11 focus:ring-primary" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="type" className="text-sm font-bold">Asset Type</Label>
              <Select name="type" required>
                <SelectTrigger className="bg-muted/30 h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Bridge">Bridge</SelectItem>
                  <SelectItem value="Pipeline">Pipeline</SelectItem>
                  <SelectItem value="Streetlight">Streetlight</SelectItem>
                  <SelectItem value="Public Facility">Public Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-bold">Deployment Location</Label>
              <Input id="location" name="location" placeholder="e.g. North Sector, Zone 4" required className="bg-muted/30 h-11" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-bold">System Status</Label>
              <Select name="status" defaultValue="Operational">
                <SelectTrigger className="bg-muted/30 h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6 pt-4 bg-muted/20 p-6 rounded-xl border border-dashed border-primary/20">
            <div className="flex justify-between items-center">
              <Label htmlFor="healthScore" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Calibration: Health Score</Label>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{healthScore}</span>
                <span className="text-xs font-bold text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[healthScore]}
              onValueChange={(val) => setHealthScore(val[0])}
              max={100}
              step={1}
              className="py-4"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold btn-gradient" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Synchronizing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-5 w-5" /> Register System Asset
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}