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
import { Send, AlertCircle, Loader2, Calendar, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CitizenReportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    
    if (!date) {
      toast({ 
        variant: "destructive", 
        title: "Date Required", 
        description: "Please select the date when the issue occurred." 
      });
      setLoading(false);
      return;
    }

    const issueData = {
      issueType: formData.get("issueType") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      date: date.toISOString(), // Store as ISO string
      status: "Reported",
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "issues"), issueData);
      toast({ 
        title: "Report Submitted Successfully", 
        description: "Your issue has been received and will be reviewed by city authorities." 
      });
      // Reset form after successful submission
      form.reset();
      setDate(new Date());
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast({ 
        variant: "destructive", 
        title: "Submission Failed", 
        description: "Could not submit your report. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl ring-1 ring-border overflow-hidden card-glow">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 w-full" />
        <CardHeader className="pb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Citizen Issue Reporting Portal</span>
          </div>
          <CardTitle className="text-3xl font-bold">Report Infrastructure Issue</CardTitle>
          <CardDescription className="text-base">
            Help us maintain city infrastructure by reporting issues you encounter. Your reports help us respond faster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="issueType" className="text-sm font-bold">Issue Category *</Label>
                <Select name="issueType" required>
                  <SelectTrigger className="bg-muted/30 h-11">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pothole">Pothole</SelectItem>
                    <SelectItem value="Broken Streetlight">Broken Streetlight</SelectItem>
                    <SelectItem value="Water Leakage">Water Leakage</SelectItem>
                    <SelectItem value="Road Damage">Road Damage</SelectItem>
                    <SelectItem value="Power Failure">Power Failure</SelectItem>
                    <SelectItem value="Traffic Congestion">Traffic Congestion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-bold">Date of Issue *</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal bg-muted/30",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        setDatePickerOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <Input 
                id="location" 
                name="location" 
                placeholder="Street address, landmark, or area (e.g., Main Street near City Park)" 
                required 
                className="bg-muted/30 h-11" 
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-bold">Detailed Description *</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Please provide specific details about the issue. Include any relevant information that would help our team locate and address the problem..." 
                rows={6} 
                required 
                className="bg-muted/30 resize-none"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Your report will be reviewed by city authorities. You will receive updates on the status of your report.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold btn-gradient" 
              disabled={loading || !date}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting Report...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-5 w-5" /> Submit Report
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

