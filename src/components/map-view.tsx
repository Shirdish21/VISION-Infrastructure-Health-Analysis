"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MapPin } from "lucide-react";
import type { InfrastructureAsset } from "@/lib/definitions";

// Default center: Chennai, India
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [unmappedCount, setUnmappedCount] = useState(0);

  // 1. Fetch assets from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const allAssets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InfrastructureAsset));
      const mapped = allAssets.filter(a => a.lat && a.lng);
      setAssets(mapped);
      setUnmappedCount(allAssets.length - mapped.length);
    });
    return unsub;
  }, []);

  // 2. Initialize Map once and handle cleanup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(DEFAULT_CENTER, 12);
    
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Update Markers when assets data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const getMarkerColor = (score: number) => {
      if (score > 70) return "#10b981"; // Emerald 500
      if (score >= 40) return "#f59e0b"; // Amber 500
      return "#ef4444"; // Red 500
    };

    assets.forEach((asset) => {
      if (asset.lat && asset.lng) {
        const markerColor = getMarkerColor(asset.healthScore);
        const marker = L.circleMarker([asset.lat, asset.lng], {
          radius: 10,
          fillColor: markerColor,
          fillOpacity: 0.8,
          color: "#ffffff",
          weight: 2,
        });

        const popupContent = `
          <div class="p-1 min-w-[160px] font-body">
            <h3 class="text-sm font-black mb-2" style="color: #2563eb;">${asset.name}</h3>
            <div style="font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Type:</span>
                <span style="font-weight: 700;">${asset.type}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Location:</span>
                <span style="font-weight: 700;">${asset.location}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Status:</span>
                <span style="background: #2563eb; color: white; padding: 1px 4px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase;">${asset.status}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid #e2e8f0; margin-top: 2px;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Health:</span>
                <span style="font-weight: 900; font-size: 13px; color: ${markerColor}">${asset.healthScore}%</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'vision-map-popup'
        });
        marker.addTo(markersLayer);
      }
    });
  }, [assets]);

  return (
    <div className="space-y-4">
      {unmappedCount > 0 && (
        <Alert variant="destructive" className="animate-in-fade bg-rose-500/10 border-rose-500/20 text-rose-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Missing Geospatial Data</AlertTitle>
          <AlertDescription className="text-xs">
            There are {unmappedCount} infrastructure assets registered without precise geographic coordinates. These assets are excluded from the visual intelligence map. Please update them in the <span className="font-black underline">Assets</span> tab.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full h-[600px] overflow-hidden border-none shadow-2xl ring-1 ring-border rounded-xl animate-in-fade relative z-0">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-0" 
          aria-label="City Infrastructure Map"
        />
        
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
    </div>
  );
}
