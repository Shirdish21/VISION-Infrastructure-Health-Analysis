
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
      if (score >= 80) return "#10b981"; // Emerald 500
      if (score >= 50) return "#f59e0b"; // Amber 500
      return "#ef4444"; // Red 500
    };

    assets.forEach((asset) => {
      if (asset.lat && asset.lng) {
        const markerColor = getMarkerColor(asset.healthScore);
        const marker = L.circleMarker([asset.lat, asset.lng], {
          radius: 12,
          fillColor: markerColor,
          fillOpacity: 0.9,
          color: "#ffffff",
          weight: 3,
        });

        // Detailed Popup Content
        const popupContent = `
          <div class="p-2 min-w-[180px] font-body">
            <h3 class="text-sm font-black mb-3 border-b pb-1" style="color: #2563eb;">${asset.name}</h3>
            <div style="font-size: 11px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Class:</span>
                <span style="font-weight: 700;">${asset.type}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Zone:</span>
                <span style="font-weight: 700;">${asset.zone}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Status:</span>
                <span style="background: ${markerColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase;">${asset.healthStatus}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px dashed #e2e8f0; margin-top: 2px;">
                <span style="color: #64748b; font-weight: 700; text-transform: uppercase;">Health Index:</span>
                <span style="font-weight: 900; font-size: 14px; color: ${markerColor}">${asset.healthScore}%</span>
              </div>
            </div>
          </div>
        `;

        // Permanent Tooltip for quick identification
        marker.bindTooltip(`
          <div style="font-weight: 900; font-size: 10px; color: #1e293b; padding: 2px 4px;">
            ${asset.name}<br/>
            <span style="font-size: 8px; font-weight: 700; color: #64748b;">${asset.type.toUpperCase()}</span>
          </div>
        `, { 
          permanent: false, 
          direction: 'top',
          offset: [0, -10],
          opacity: 0.9
        });

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
          <AlertTitle className="font-bold">Missing Geospatial Intelligence</AlertTitle>
          <AlertDescription className="text-xs">
            There are {unmappedCount} infrastructure assets registered without precise geographic coordinates. These assets are excluded from the visual intelligence map. Update them in the <span className="font-black underline">Assets</span> tab to calibrate their positions.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full h-[650px] overflow-hidden border-none shadow-2xl ring-1 ring-border rounded-xl animate-in-fade relative z-0">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-0" 
          aria-label="City Infrastructure Intelligence Map"
        />
        
        {/* Custom Map Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md p-5 rounded-xl border shadow-2xl flex flex-col gap-4 pointer-events-none sm:pointer-events-auto border-primary/20">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-primary/10 pb-2">Intelligence Legend</p>
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white" />
            <span className="text-[11px] font-bold">Optimal (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] border-2 border-white" />
            <span className="text-[11px] font-bold">Standard (50-80%)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] border-2 border-white" />
            <span className="text-[11px] font-bold">Critical (&lt;50%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
