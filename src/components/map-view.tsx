"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Zone } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';


export function MapView() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const firestore = useFirestore();
    const { data: zones, loading } = useCollection<Zone>(firestore ? collection(firestore, 'zones') : null);
    const zonePolygonsRef = useRef<Record<string, google.maps.Polygon>>({});

    useEffect(() => {
        if (!mapRef.current || map) return;

        const initMap = () => {
            const mapInstance = new google.maps.Map(mapRef.current!, {
                center: { lat: 13.6288, lng: 79.4192 },
                zoom: 17,
                mapTypeId: 'roadmap',
                disableDefaultUI: true,
            });
            setMap(mapInstance);
        };

        if (window.google && window.google.maps) {
            initMap();
        }
    }, [mapRef, map]);

    useEffect(() => {
        if (map && !loading && zones) {
             // Clear existing polygons before drawing new ones
            Object.values(zonePolygonsRef.current).forEach(p => p.setMap(null));
            zonePolygonsRef.current = {};

            zones.forEach(zone => {
                const zonePolygon = new google.maps.Polygon({
                    paths: zone.polygon,
                    strokeColor: '#1E88E5',
                    strokeWeight: 2,
                    fillColor: '#90CAF9',
                    fillOpacity: 0.25,
                    map: map,
                });
                zonePolygonsRef.current[zone.id] = zonePolygon;

                (zone.subzones || []).forEach(subzone => {
                    const subZonePolygon = new google.maps.Polygon({
                        paths: subzone.polygon,
                        strokeColor: '#2E7D32',
                        strokeWeight: 1,
                        fillColor: '#A5D6A7',
                        fillOpacity: 0.35,
                        map: map,
                    });
                     // We don't store sub-zone polygons in the ref as they are read-only here
                });
            });
        }
    }, [map, zones, loading]);


    return (
         <div className="h-[70vh] w-full rounded-lg overflow-hidden" ref={mapRef}>
            {loading && <div className="w-full h-full flex items-center justify-center bg-muted"><p>Loading Map and Zones...</p></div>}
        </div>
    )
}
