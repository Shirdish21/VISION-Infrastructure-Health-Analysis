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
    <div className="space-y-2">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[300px] rounded-lg border shadow-inner z-0" 
      />
      <p className="text-[10px] text-muted-foreground italic">
        Click on the map to set the precise infrastructure deployment coordinate.
      </p>
    </div>
  );
}
