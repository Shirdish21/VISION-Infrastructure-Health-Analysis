"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, AlertCircle, Loader2 } from "lucide-react";

export default function IssueReporting() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const issueData = {
      issueType: formData.get("issueType") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      status: "Reported",
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "issues"), issueData);
      toast({ title: "Signal Sent", description: "Civil authorities have received your transmission." });
      // Reset form after successful submission
      form.reset();
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast({ variant: "destructive", title: "Transmission Failed", description: "Could not sync report with central database." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-none shadow-xl ring-1 ring-border overflow-hidden card-glow animate-in-fade">
      <div className="bg-gradient-to-r from-rose-600 to-red-600 h-2 w-full" />
      <CardHeader className="pb-8">
        <div className="flex items-center gap-2 text-destructive mb-2">
           <AlertCircle className="h-5 w-5" />
           <span className="text-xs font-bold uppercase tracking-widest">Incident Alert</span>
        </div>
        <CardTitle className="text-2xl font-bold">Report Infrastructure Issue</CardTitle>
        <CardDescription>Flag urban failures or system hazards for immediate attention.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="issueType" className="text-sm font-bold">Category of Failure</Label>
              <Select name="issueType" required>
                <SelectTrigger className="bg-muted/30 h-11">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pothole">Pothole</SelectItem>
                  <SelectItem value="Broken Streetlight">Broken Streetlight</SelectItem>
                  <SelectItem value="Water Leakage">Water Leakage</SelectItem>
                  <SelectItem value="Road Damage">Road Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-bold">Precise Location</Label>
              <Input id="location" name="location" placeholder="Street address or GPS vicinity" required className="bg-muted/30 h-11" />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-bold">Detailed Incident Log</Label>
            <div className="relative">
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Provide specific technical details of the failure..." 
                rows={5} 
                required 
                className="bg-muted/30 resize-none pt-4"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-base font-bold btn-destructive-gradient" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Broadcasting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-5 w-5" /> Dispatch Issue Report
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}