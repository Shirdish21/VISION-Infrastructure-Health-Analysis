
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit as firestoreLimit,
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Edit2, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InfrastructureAsset, HealthStatus, AlertSeverity } from "@/lib/definitions";

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
});

interface AssetListProps {
  limit?: number;
  filters?: {
    type: string;
    status: string;
    zone: string;
  };
}

export default function AssetList({ limit, filters }: AssetListProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [editingAsset, setEditingAsset] = useState<InfrastructureAsset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let q = query(collection(db, "infrastructure"), orderBy("healthScore", "asc"));
    if (limit) {
      q = query(q, firestoreLimit(limit));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset));
      if (filters) {
        setAssets(all.filter(asset => {
          const typeMatch = filters.type === 'all' || asset.type === filters.type;
          const statusMatch = filters.status === 'all' || asset.healthStatus === filters.status;
          const zoneMatch = filters.zone === 'all' || asset.zone === filters.zone;
          
          // Date filtering
          let dateMatch = true;
          if (filters.date && asset.createdAt) {
            const assetDate = asset.createdAt?.toDate ? asset.createdAt.toDate() : new Date(asset.createdAt);
            const filterDate = new Date(filters.date);
            dateMatch = assetDate.toDateString() === filterDate.toDateString();
          }
          
          return typeMatch && statusMatch && zoneMatch && dateMatch;
        }));
      } else {
        setAssets(all);
      }
    });

    return () => unsubscribe();
  }, [limit, filters]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (score >= 60) return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
    if (score >= 30) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
    return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Operational': return 'default';
      case 'Maintenance': return 'outline';
      case 'Critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDelete = async () => {
    if (!deletingAssetId) return;
    try {
      await deleteDoc(doc(db, "infrastructure", deletingAssetId));
      toast({ title: "Asset deleted", description: "Permanent removal confirmed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Sync error." });
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset?.id || isUpdating) return; // Prevent double submission
    
    setIsUpdating(true);
    try {
      const assetRef = doc(db, "infrastructure", editingAsset.id);
      
      // Update classification ranges: 80-100: Optimal, 60-79: Standard, 30-59: Warning, 0-29: Critical
      let newHealthStatus: HealthStatus = 'Optimal';
      if (editingAsset.healthScore < 30) newHealthStatus = 'Critical';
      else if (editingAsset.healthScore < 60) newHealthStatus = 'Warning';
      else if (editingAsset.healthScore < 80) newHealthStatus = 'Standard';

      const updatedData = {
        ...editingAsset,
        healthStatus: newHealthStatus,
        status: newHealthStatus === 'Critical' ? 'Critical' : newHealthStatus === 'Warning' ? 'Maintenance' : 'Operational',
        lastUpdated: serverTimestamp()
      };

      // Alert Logic for Critical Transitions
      if (newHealthStatus === 'Critical') {
        const alertsQuery = query(
          collection(db, "alerts"), 
          where("assetId", "==", editingAsset.id),
          where("type", "==", "Critical Infrastructure Health")
        );
        const alertSnap = await getDocs(alertsQuery);
        
        if (alertSnap.empty) {
          await addDoc(collection(db, "alerts"), {
            assetId: editingAsset.id,
            assetName: editingAsset.name,
            type: "Critical Infrastructure Health",
            severity: 'Critical',
            description: `Manual update detected critical health drop to ${editingAsset.healthScore}%.`,
            location: editingAsset.location,
            timestamp: serverTimestamp()
          });
        }
      }

      const { id, ...dataToSave } = updatedData;
      await updateDoc(assetRef, dataToSave);
      toast({ title: "Asset updated", description: "Intelligence metrics refreshed." });
      setEditingAsset(null);
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Sync failure." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-none shadow-sm ring-1 ring-border card-glow animate-in-fade">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">Stable Health Inventory</CardTitle>
          <CardDescription>Urban hardware surveillance with static sensor data.</CardDescription>
        </div>
        {limit && (
           <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
        )}
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-bold">Asset Name</TableHead>
              <TableHead className="font-bold">Utilization</TableHead>
              <TableHead className="font-bold">Health Index</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              {!limit && <TableHead className="text-right font-bold">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No health data records found.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => {
                const util = asset.capacity ? (asset.usage! / asset.capacity!) * 100 : 0;
                return (
                  <TableRow key={asset.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="font-semibold">{asset.name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{asset.type}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                           <span className="text-muted-foreground uppercase">Load</span>
                           <span className={util > 95 ? 'text-rose-500' : ''}>{util.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-1000 ${util > 95 ? 'bg-rose-500' : 'bg-primary'}`} 
                              style={{ width: `${util}%` }} 
                           />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${getHealthColor(asset.healthScore)}`} />
                        <span className={`text-sm font-black ${asset.healthScore < 30 ? 'text-rose-500' : ''}`}>
                          {asset.healthScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(asset.status)} className="font-bold px-2.5 py-0.5 uppercase tracking-tighter text-[10px]">
                        {asset.status}
                      </Badge>
                    </TableCell>
                    {!limit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => setEditingAsset(asset)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setDeletingAssetId(asset.id || null)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Health Overwrite</DialogTitle>
            <DialogDescription>Manually adjust health metrics. Health can now drop to 0% for critical assets.</DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <form onSubmit={handleUpdate} className="space-y-6 pt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input 
                    id="edit-name" 
                    value={editingAsset.name} 
                    onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})}
                    className="bg-muted/30"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input 
                      type="number"
                      value={editingAsset.temperature} 
                      onChange={(e) => setEditingAsset({...editingAsset, temperature: Number(e.target.value)})}
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pressure (PSI)</Label>
                    <Input 
                      type="number"
                      value={editingAsset.pressure} 
                      onChange={(e) => setEditingAsset({...editingAsset, pressure: Number(e.target.value)})}
                      className="bg-muted/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usage Load</Label>
                    <Input 
                      type="number"
                      value={editingAsset.usage} 
                      onChange={(e) => setEditingAsset({...editingAsset, usage: Number(e.target.value)})}
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Capacity</Label>
                    <Input 
                      type="number"
                      value={editingAsset.capacity} 
                      onChange={(e) => setEditingAsset({...editingAsset, capacity: Number(e.target.value)})}
                      className="bg-muted/30"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Position Update
                  </Label>
                  <LocationPicker 
                    initialLat={editingAsset.lat || undefined} 
                    initialLng={editingAsset.lng || undefined} 
                    onLocationSelect={(lat, lng) => setEditingAsset({...editingAsset, lat, lng})}
                  />
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Admin-Defined Health Score</Label>
                      <span className="text-lg font-black text-primary">{editingAsset.healthScore}%</span>
                   </div>
                   <Slider 
                    value={[editingAsset.healthScore]} 
                    onValueChange={(val) => setEditingAsset({...editingAsset, healthScore: val[0]})}
                    max={100}
                    step={1}
                   />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full btn-gradient" 
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Committing Changes...
                    </span>
                  ) : "Lock Health Intelligence"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAssetId} onOpenChange={(open) => !open && setDeletingAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently purge the asset from the surveillance database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Purge Asset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
