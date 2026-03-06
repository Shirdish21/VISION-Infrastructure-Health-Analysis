
"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startPos: [number, number] = initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER;

    const map = L.map(mapContainerRef.current).setView(startPos, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Initial marker if position exists
    if (initialLat && initialLng) {
      markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng).addTo(map);
      }

      setCoords({ lat, lng });
      onLocationSelect(lat, lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng, onLocationSelect]);

  return (
    <div className="space-y-4">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[300px] rounded-lg border shadow-inner z-0 relative" 
      />
      <div className="flex flex-col gap-2 bg-muted/40 p-4 rounded-lg border border-border/50">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Geospatial Intelligence Anchor</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Latitude</span>
            <div className="font-mono text-sm bg-background px-2 py-1 rounded border border-border/50">
              {coords ? coords.lat.toFixed(6) : "Not Set"}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Longitude</span>
            <div className="font-mono text-sm bg-background px-2 py-1 rounded border border-border/50">
              {coords ? coords.lng.toFixed(6) : "Not Set"}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-primary font-medium italic mt-2">
          Click on the map above to accurately anchor the infrastructure coordinate.
        </p>
      </div>
    </div>
  );
}
