'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Zone, User } from '@/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

export function ZoneMapEditor() {
    const firestore = useFirestore();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [status, setStatus] = useState('Initializing...');
    
    const { data: zones, loading: zonesLoading } = useCollection<Zone>(firestore ? collection(firestore, 'zones') : null);
    const { data: volunteers, loading: volunteersLoading } = useCollection<User>(firestore ? query(collection(firestore, 'users'), where('role', '==', 'volunteer')) : null);

    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const zonePolygonsRef = useRef<Record<string, google.maps.Polygon>>({});
    const subZonePolygonsRef = useRef<Record<string, google.maps.Polygon>>({});
    const [selectedEventId, setSelectedEventId] = useState<string>('active-event-id'); // Hardcoded for now
    const [pendingSubZoneParent, setPendingSubZoneParent] = useState<string | null>(null);


    useEffect(() => {
        if (!mapRef.current || map) return;
        const initMap = () => {
            const mapInstance = new google.maps.Map(mapRef.current!, {
                center: { lat: 13.6288, lng: 79.4192 },
                zoom: 17,
                mapTypeId: 'roadmap',
            });
            setMap(mapInstance);
            setStatus('Ready');
        };
        if (window.google && window.google.maps) initMap();
    }, [mapRef, map]);

    useEffect(() => {
        if (!map || zonesLoading) return;

        // Clear existing polygons before drawing new ones
        Object.values(zonePolygonsRef.current).forEach(p => p.setMap(null));
        zonePolygonsRef.current = {};
        Object.values(subZonePolygonsRef.current).forEach(p => p.setMap(null));
        subZonePolygonsRef.current = {};

        zones.forEach(zone => {
            const zonePolygon = new google.maps.Polygon({
                paths: zone.polygon,
                editable: true,
                draggable: true,
                map: map,
                strokeColor: '#1E88E5',
                fillColor: '#90CAF9',
                fillOpacity: 0.25,
            });
            zonePolygonsRef.current[zone.id] = zonePolygon;

            const updateZoneData = () => {
                const newPath = zonePolygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
                 if (firestore) {
                    const zoneRef = doc(firestore, 'zones', zone.id);
                    setDoc(zoneRef, { polygon: newPath }, { merge: true });
                }
            };
            
            zonePolygon.getPaths().forEach(path => {
                google.maps.event.addListener(path, 'set_at', updateZoneData);
                google.maps.event.addListener(path, 'insert_at', updateZoneData);
            });
            google.maps.event.addListener(zonePolygon, 'dragend', updateZoneData);


            (zone.subzones || []).forEach(subzone => {
                const subZonePolygon = new google.maps.Polygon({
                    paths: subzone.polygon,
                    editable: true,
                    draggable: true,
                    map: map,
                    strokeColor: '#2E7D32',
                    fillColor: '#A5D6A7',
                    fillOpacity: 0.35,
                });
                subZonePolygonsRef.current[subzone.id] = subZonePolygon;

                const updateSubZoneData = () => {
                    const newPath = subZonePolygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
                    const updatedSubzones = zone.subzones?.map(sz => sz.id === subzone.id ? { ...sz, polygon: newPath } : sz);
                     if (firestore) {
                        const zoneRef = doc(firestore, 'zones', zone.id);
                        setDoc(zoneRef, { subzones: updatedSubzones }, { merge: true });
                    }
                };
                subZonePolygon.getPaths().forEach(path => {
                    google.maps.event.addListener(path, 'set_at', updateSubZoneData);
                    google.maps.event.addListener(path, 'insert_at', updateSubZoneData);
                });
                 google.maps.event.addListener(subZonePolygon, 'dragend', updateSubZoneData);
            });
        });

    }, [map, zones, zonesLoading, firestore]);
    
    useEffect(() => {
        if (!map) return;

        if (drawingManagerRef.current) drawingManagerRef.current.setMap(null);

        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: { editable: true, draggable: true },
        });

        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        const onPolygonComplete = async (polygon: google.maps.Polygon) => {
            const path = polygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
            polygon.setMap(null); // Remove temporary polygon
            drawingManager.setDrawingMode(null);

            if (pendingSubZoneParent) {
                const parentZone = zones.find(z => z.id === pendingSubZoneParent);
                if (!parentZone) return;
                
                const subZoneId = `sub_${Date.now()}`;
                const name = prompt('Enter Sub-zone Name', `Sub-zone ${ (parentZone.subzones?.length || 0) + 1}`);
                if (!name) return;

                const newSubZone = {
                    id: subZoneId,
                    name: name,
                    polygon: path,
                    volunteers: [],
                };
                
                const updatedSubzones = [...(parentZone.subzones || []), newSubZone];
                if (firestore) {
                    await setDoc(doc(firestore, 'zones', parentZone.id), { subzones: updatedSubzones }, { merge: true });
                }
                setPendingSubZoneParent(null);
                setStatus('Sub-zone added.');

            } else {
                const zoneId = `zone_${Date.now()}`;
                const name = prompt('Enter Zone Name', `Zone ${zones.length + 1}`);
                if (!name) return;

                const newZone: Omit<Zone, 'id'> = {
                    name,
                    eventId: selectedEventId,
                    polygon: path,
                    subzones: [],
                };
                if (firestore) {
                    await setDoc(doc(firestore, 'zones', zoneId), newZone);
                }
                setStatus('Zone added.');
            }
        };

        google.maps.event.addListener(drawingManager, 'polygoncomplete', onPolygonComplete);

        return () => {
             if (drawingManagerRef.current) {
                google.maps.event.clearInstanceListeners(drawingManagerRef.current);
                drawingManagerRef.current.setMap(null);
            }
        };

    }, [map, firestore, zones, pendingSubZoneParent, selectedEventId]);

    const handleAddSubZoneClick = (zoneId: string) => {
        setPendingSubZoneParent(zoneId);
        drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        setStatus(`Drawing sub-zone for ${zoneId}. Draw on map.`);
    };

    const handleDeleteZone = async (zoneId: string) => {
        if (!firestore || !confirm('Are you sure you want to delete this zone and all its sub-zones?')) return;
        await deleteDoc(doc(firestore, 'zones', zoneId));
    };

    const handleDeleteSubZone = async (zoneId: string, subZoneId: string) => {
        if (!firestore || !confirm('Delete sub-zone?')) return;
        const parentZone = zones.find(z => z.id === zoneId);
        if (!parentZone) return;

        const updatedSubzones = parentZone.subzones?.filter(sz => sz.id !== subZoneId);
        await setDoc(doc(firestore, 'zones', zoneId), { subzones: updatedSubzones }, { merge: true });
    };

    const handleAssignVolunteer = async (zoneId: string, subZoneId: string, volunteerId: string) => {
        if (!firestore) return;
        const parentZone = zones.find(z => z.id === zoneId);
        if (!parentZone) return;
        const volunteer = volunteers.find(v => v.id === volunteerId);
        if(!volunteer) return;

        const updatedSubzones = parentZone.subzones?.map(sz => {
            if (sz.id === subZoneId) {
                const newVolunteers = [...(sz.volunteers || []), volunteer.name];
                return { ...sz, volunteers: Array.from(new Set(newVolunteers)) };
            }
            return sz;
        });

        await setDoc(doc(firestore, 'zones', zoneId), { subzones: updatedSubzones }, { merge: true });
    };
    
    const handleRemoveVolunteer = async (zoneId: string, subZoneId: string, volunteerName: string) => {
        if (!firestore) return;
        const parentZone = zones.find(z => z.id === zoneId);
        if (!parentZone) return;

         const updatedSubzones = parentZone.subzones?.map(sz => {
            if (sz.id === subZoneId) {
                const newVolunteers = sz.volunteers?.filter(v => v !== volunteerName);
                return { ...sz, volunteers: newVolunteers };
            }
            return sz;
        });
        await setDoc(doc(firestore, 'zones', zoneId), { subzones: updatedSubzones }, { merge: true });
    }

    return (
        <div className="zone-editor-container">
            <div ref={mapRef} className="map-panel" />
            <div className="right-panel">
                <h2>Flow-Track — Zones & Volunteers</h2>
                <div className="card">
                    <div className="small">Drawing Tools</div>
                    <p className="small">Click the polygon icon on the map to draw a zone. To create sub-zones, use "Add Sub-zone" on a zone card, then draw on the map.</p>
                    <p className="small mt-2"><strong>Status:</strong> {status}</p>
                </div>
                <div id="zones-list">
                    {zonesLoading ? <p>Loading zones...</p> : zones.map(zone => (
                        <div key={zone.id} className="card">
                            <div className="zone-title"><strong>{zone.name}</strong></div>
                             <div className="mt-2 flex gap-2 flex-wrap">
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteZone(zone.id)}>Delete Zone</Button>
                                <Button size="sm" onClick={() => handleAddSubZoneClick(zone.id)}>Add Sub-zone</Button>
                            </div>
                            <div className='mt-4 space-y-2'>
                                {(zone.subzones || []).map(subzone => (
                                    <div key={subzone.id} className="subzone-card">
                                        <div className='flex justify-between items-center'>
                                            <p className='font-semibold'>{subzone.name}</p>
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteSubZone(zone.id, subzone.id)}>Delete</Button>
                                        </div>
                                        <div className='mt-2'>
                                            <Label>Assign Volunteer:</Label>
                                             <div className='flex gap-2 mt-1'>
                                                <Select onValueChange={(val) => handleAssignVolunteer(zone.id, subzone.id, val)}>
                                                    <SelectTrigger><SelectValue placeholder="Select volunteer..."/></SelectTrigger>
                                                    <SelectContent>
                                                        {volunteersLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : volunteers.map(v => (
                                                            <SelectItem key={v.id} value={v.id} disabled={(subzone.volunteers || []).includes(v.name)}>{v.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className='mt-2 space-y-1'>
                                            <p className='text-xs font-medium'>Assigned:</p>
                                            {(subzone.volunteers || []).length === 0 && <p className='text-xs text-muted-foreground'>No volunteers assigned.</p>}
                                            {(subzone.volunteers || []).map((vol, idx) => (
                                                <div key={idx} className='flex justify-between items-center text-sm'>
                                                    <span>{vol}</span>
                                                    <Button size='sm' variant='ghost' onClick={() => handleRemoveVolunteer(zone.id, subzone.id, vol)}>Remove</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style jsx>{`
                .zone-editor-container {
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    gap: 16px;
                    height: calc(100vh - 57px);
                    padding: 0;
                }
                .map-panel {
                    width: 100%;
                    height: 100%;
                }
                .right-panel {
                    width: 380px;
                    box-sizing: border-box;
                    padding: 18px;
                    overflow-y: auto;
                    background: hsl(var(--card));
                    border-left: 1px solid hsl(var(--border));
                }
                h2 { margin:4px 0 14px; font-size:18px; line-height:1.2; font-weight:600; }
                .card {
                     background: hsl(var(--background));
                     padding:12px;
                     margin-bottom:12px;
                     border-radius: 0.5rem;
                     border:1px solid hsl(var(--border));
                }
                .small { font-size:12px; color: hsl(var(--muted-foreground)); }
                #zones-list { margin-top:6px; display:flex; flex-direction:column; gap:10px; }
                .zone-title { display:flex; justify-content:space-between; align-items:center; gap:8px; }
                .zone-title strong { font-size:14px; font-weight:600; }
                .subzone-card { margin-top:8px; padding:8px; background:hsl(var(--card)); border-radius:8px; border:1px solid hsl(var(--border)); }

                 @media (max-width:980px) {
                    .zone-editor-container {
                        grid-template-columns: 1fr;
                        height: auto;
                    }
                    .map-panel { height: 60vh; }
                    .right-panel { width:100%; height: auto; }
                }
            `}</style>
        </div>
    );
}
