
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
  updateDoc
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
import { MapPin, ArrowRight, Edit2, Trash2, Loader2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InfrastructureAsset } from "@/lib/definitions";

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
});

interface AssetListProps {
  limit?: number;
}

export default function AssetList({ limit }: AssetListProps) {
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
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset)));
    }, (error) => {
      console.error("Snapshot error:", error);
    });

    return () => unsubscribe();
  }, [limit]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (score >= 50) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
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
      toast({ title: "Asset deleted", description: "Permanent removal from surveillance database confirmed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Database transmission error." });
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset?.id) return;
    
    setIsUpdating(true);
    try {
      const assetRef = doc(db, "infrastructure", editingAsset.id);
      const { id, ...updateData } = editingAsset;
      await updateDoc(assetRef, updateData);
      toast({ title: "Asset updated successfully", description: "Metrics resynchronized with central network." });
      setEditingAsset(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Sync failure detected." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-none shadow-sm ring-1 ring-border card-glow animate-in-fade">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">Health Inventory</CardTitle>
          <CardDescription>Urban hardware surveillance and computed health metrics.</CardDescription>
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
                           <span className={util > 90 ? 'text-rose-500' : ''}>{util.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-1000 ${util > 90 ? 'bg-rose-500' : 'bg-primary'}`} 
                              style={{ width: `${util}%` }} 
                           />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${getHealthColor(asset.healthScore)}`} />
                        <span className={`text-sm font-black ${asset.healthScore < 50 ? 'text-rose-500' : ''}`}>
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
            <DialogTitle>Edit Health Metrics</DialogTitle>
            <DialogDescription>Manually override hardware parameters or re-calibrate geolocation.</DialogDescription>
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
                    <Label>Type</Label>
                    <Select value={editingAsset.type} onValueChange={(val: any) => setEditingAsset({...editingAsset, type: val})}>
                      <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Road">Road</SelectItem>
                        <SelectItem value="Bridge">Bridge</SelectItem>
                        <SelectItem value="Pipeline">Pipeline</SelectItem>
                        <SelectItem value="Streetlight">Streetlight</SelectItem>
                        <SelectItem value="Public Facility">Public Facility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Design Capacity</Label>
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
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Calibrated Health Score</Label>
                      <span className="text-lg font-black text-primary">{editingAsset.healthScore}%</span>
                   </div>
                   <Slider 
                    value={[editingAsset.healthScore]} 
                    onValueChange={(val) => setEditingAsset({...editingAsset, healthScore: val[0]})}
                    max={100}
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Resyncing...
                    </span>
                  ) : "Update Asset Intelligence"}
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
              This action will permanently purge the asset from the intelligence monitoring system.
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
