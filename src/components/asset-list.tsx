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
import { MapPin, ArrowRight, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
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
    let q = query(collection(db, "infrastructure"), orderBy("createdAt", "desc"));
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
    if (score > 70) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (score >= 40) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
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
      toast({ title: "Asset deleted", description: "The record has been permanently removed from the network." });
    } catch (e) {
      console.error("Delete error:", e);
      toast({ variant: "destructive", title: "Delete Failed", description: "System error while attempting to purge record." });
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
      toast({ title: "Asset updated successfully", description: `${editingAsset.name} has been resynchronized with current metrics.` });
      setEditingAsset(null);
    } catch (e) {
      console.error("Update error:", e);
      toast({ variant: "destructive", title: "Update Failed", description: "Transmission error with central database." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-none shadow-sm ring-1 ring-border card-glow animate-in-fade">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">Infrastructure Assets</CardTitle>
          <CardDescription>Directory of urban hardware and surveillance metrics.</CardDescription>
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
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold">Location</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Health</TableHead>
              {!limit && <TableHead className="text-right font-bold">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={limit ? 5 : 6} className="text-center py-12 text-muted-foreground">
                  No records found in the intelligence network.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <TableCell className="font-semibold">{asset.name}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase tracking-wider">
                      {asset.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <MapPin className={`h-3.5 w-3.5 ${(asset.lat && asset.lng) ? 'text-primary' : 'text-rose-500'}`} />
                        {asset.location}
                      </div>
                      {(!asset.lat || !asset.lng) && (
                        <div className="flex items-center gap-1 text-rose-500 text-[9px] font-bold uppercase tracking-tighter">
                          <AlertCircle className="h-2 w-2" /> No Geo-Coordinates
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(asset.status)} className="font-bold px-2.5 py-0.5 uppercase tracking-tighter text-[10px]">
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${getHealthColor(asset.healthScore)}`} />
                      <span className="text-xs font-bold">{asset.healthScore}%</span>
                    </div>
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Infrastructure</DialogTitle>
            <DialogDescription>Modify existing asset parameters and geographic deployment.</DialogDescription>
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
                    <Label>Status</Label>
                    <Select value={editingAsset.status} onValueChange={(val: any) => setEditingAsset({...editingAsset, status: val})}>
                      <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Sector / Area Description</Label>
                  <Input 
                    id="edit-location" 
                    value={editingAsset.location} 
                    onChange={(e) => setEditingAsset({...editingAsset, location: e.target.value})}
                    className="bg-muted/30"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Position on Map
                  </Label>
                  <LocationPicker 
                    initialLat={editingAsset.lat || undefined} 
                    initialLng={editingAsset.lng || undefined} 
                    onLocationSelect={(lat, lng) => setEditingAsset({...editingAsset, lat, lng})}
                  />
                  {(editingAsset.lat && editingAsset.lng) && (
                    <div className="text-[10px] font-mono text-center text-muted-foreground opacity-70">
                      SAVED POS: {editingAsset.lat.toFixed(6)}, {editingAsset.lng.toFixed(6)}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase">Health Score</Label>
                      <span className="text-lg font-bold text-primary">{editingAsset.healthScore}%</span>
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Synchronizing...
                    </span>
                  ) : "Update Infrastructure"}
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
              This action cannot be undone. This will permanently delete the infrastructure record from the surveillance database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Delete Asset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
