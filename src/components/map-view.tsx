
"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InfrastructureAsset } from "@/lib/definitions";

// Default center: Chennai, India
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

export default function MapView() {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      setAssets(
        snapshot.docs.map((doc) => {
          const data = doc.data() as InfrastructureAsset;
          // Generate demo coordinates if missing
          if (!data.lat || !data.lng) {
            return {
              ...data,
              id: doc.id,
              lat: DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.1,
              lng: DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.1,
            };
          }
          return { id: doc.id, ...data };
        })
      );
    });
    return unsub;
  }, []);

  const getMarkerColor = (score: number) => {
    if (score > 70) return "#10b981"; // Emerald 500
    if (score >= 40) return "#f59e0b"; // Amber 500
    return "#ef4444"; // Red 500
  };

  return (
    <Card className="w-full h-[600px] overflow-hidden border-none shadow-2xl ring-1 ring-border rounded-xl animate-in-fade relative z-0">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {assets.map((asset) => (
          <CircleMarker
            key={asset.id}
            center={[asset.lat!, asset.lng!]}
            radius={10}
            pathOptions={{
              fillColor: getMarkerColor(asset.healthScore),
              fillOpacity: 0.8,
              color: "#ffffff",
              weight: 2,
            }}
          >
            <Popup className="vision-popup">
              <div className="p-1">
                <h3 className="text-sm font-black mb-1 text-primary">{asset.name}</h3>
                <div className="space-y-1 text-[11px]">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Type:</span>
                    <span className="font-bold">{asset.type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Location:</span>
                    <span className="font-bold">{asset.location}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Status:</span>
                    <Badge className="h-4 px-1 text-[9px] font-black uppercase">{asset.status}</Badge>
                  </p>
                  <p className="flex justify-between items-center pt-1 border-t mt-1">
                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Health:</span>
                    <span className="text-sm font-black" style={{ color: getMarkerColor(asset.healthScore) }}>
                      {asset.healthScore}%
                    </span>
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Custom Map Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md p-4 rounded-lg border shadow-xl flex flex-col gap-3 pointer-events-none sm:pointer-events-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intelligence Legend</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] font-bold">Optimal (&gt;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-[11px] font-bold">Standard (40-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-[11px] font-bold">Critical (&lt;40%)</span>
        </div>
      </div>
    </Card>
  );
}
