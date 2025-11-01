'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc, useCollection } from '@/firebase/firestore/use-doc';
import type { User as AppUser, Alert } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoFeed, AnalysisData } from '@/components/video-feed';
import { ArrowLeft, Grip, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Camera = {
  id: string;
  name: string;
  url: string;
  zoneId: string;
};

const sampleVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];

export default function CameraFeedPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemo(() => authUser ? doc(firestore!, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: organizer } = useDoc<AppUser>(userDocRef);

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, AnalysisData>>({});

  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraUrl, setNewCameraUrl] = useState('');

  const [gridSize, setGridSize] = useState(2); // 2 for 2x2 grid

  const assignedZones = useMemo(() => organizer?.assignedZones || [], [organizer]);

  useEffect(() => {
    // Pre-populate with 4 sample cameras on initial load
    if (cameras.length === 0 && assignedZones.length > 0) {
        const initialCameras = Array.from({ length: 4 }).map((_, i) => ({
            id: `cam-${i}`,
            name: `Sample Cam ${i + 1}`,
            url: sampleVideos[i % sampleVideos.length],
            zoneId: assignedZones[i % assignedZones.length] || assignedZones[0]
        }));
        setCameras(initialCameras);
    }
  }, [assignedZones, cameras.length]);


  const handleAddCamera = () => {
    if (!selectedZoneId || !newCameraName || !newCameraUrl) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a zone and enter a camera name and URL.' });
      return;
    }

    const newCamera: Camera = {
      id: `cam-${Date.now()}`,
      name: newCameraName,
      url: newCameraUrl,
      zoneId: selectedZoneId,
    };
    
    // Find first empty slot or add to the end
    const emptyIndex = cameras.findIndex(c => !c.url);
    if(emptyIndex !== -1) {
        const newCameras = [...cameras];
        newCameras[emptyIndex] = newCamera;
        setCameras(newCameras);
    } else {
        setCameras(prev => [...prev, newCamera]);
    }
    
    setNewCameraName('');
    setNewCameraUrl('');
    toast({ title: 'Camera Added', description: `${newCamera.name} has been added to the grid.` });
  };
  
  const handleRemoveCamera = (cameraId: string) => {
    setCameras(prev => prev.filter(c => c.id !== cameraId));
    setAnalysis(prev => {
        const newAnalysis = {...prev};
        delete newAnalysis[cameraId];
        return newAnalysis;
    });
  }

  const handleAnalysisUpdate = (cameraId: string, data: AnalysisData) => {
    setAnalysis(prev => ({ ...prev, [cameraId]: data }));
  };

  const handleHighDensityAlert = async (cameraName: string, zoneId: string, peopleCount: number) => {
    if (!firestore || !authUser) return;

    const message = `High congestion detected in Zone ${zoneId} near ${cameraName}. Current count: ${peopleCount}.`;
    console.log("SENDING ALERT:", message);

    const newAlert: Omit<Alert, 'id'> = {
      type: 'auto',
      zoneId,
      eventId: 'active-event-id', // This should be dynamic
      message,
      priority: 'High',
      senderId: 'system-auto',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(firestore, 'alerts'), newAlert);
      toast({
        variant: 'destructive',
        title: 'High Congestion Alert Triggered!',
        description: `An automated alert for Zone ${zoneId} has been sent to admins.`,
      });
    } catch (error) {
      console.error('Error sending high-density alert:', error);
    }
  };

  const gridClass = {
    1: 'grid-cols-1 grid-rows-1',
    2: 'grid-cols-2 grid-rows-2',
    3: 'grid-cols-3 grid-rows-3',
  }[gridSize] || 'grid-cols-2 grid-rows-2';

  const visibleCameras = useMemo(() => {
    const totalSlots = gridSize * gridSize;
    const activeCameras = cameras.slice(0, totalSlots);
    // Pad with empty slots if needed
    while (activeCameras.length < totalSlots) {
      activeCameras.push({ id: `empty-${activeCameras.length}`, name: '', url: '', zoneId: '' });
    }
    return activeCameras;
  }, [cameras, gridSize]);

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button asChild variant="ghost" size="icon" className="md:hidden">
          <Link href="/organizer">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Live Camera Feeds</h1>
      </header>
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6">
        <div className={cn("grid gap-2 flex-1", gridClass)}>
          {visibleCameras.map(camera => (
            <VideoFeed
              key={camera.id}
              camera={camera}
              onAnalysisUpdate={handleAnalysisUpdate}
              onHighDensityAlert={handleHighDensityAlert}
              onRemove={handleRemoveCamera}
            />
          ))}
        </div>

        <div className="w-full md:w-80 lg:w-96 space-y-4 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Add New Camera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="zone-select">Assign to Zone</Label>
                {organizer ? (
                  <Select onValueChange={setSelectedZoneId} value={selectedZoneId}>
                    <SelectTrigger id="zone-select">
                      <SelectValue placeholder="Select a zone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedZones.map(zoneId => <SelectItem key={zoneId} value={zoneId}>Zone {zoneId}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <p className="text-sm text-muted-foreground">Loading zones...</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="camera-name">Camera Name</Label>
                <Input id="camera-name" placeholder="e.g., Main-Entrance-Cam-1" value={newCameraName} onChange={e => setNewCameraName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="camera-url">Video Stream URL</Label>
                <Input id="camera-url" placeholder="https://.../stream.mp4" value={newCameraUrl} onChange={e => setNewCameraUrl(e.target.value)} />
              </div>
              <Button onClick={handleAddCamera} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Camera to Grid
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Grid Configuration</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid gap-1.5">
                    <Label htmlFor="grid-size-select">Grid Layout</Label>
                     <Select onValueChange={(v) => setGridSize(parseInt(v))} value={String(gridSize)}>
                        <SelectTrigger id="grid-size-select">
                            <SelectValue placeholder="Select grid size..." />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="1">1x1</SelectItem>
                           <SelectItem value="2">2x2</SelectItem>
                           <SelectItem value="3">3x3</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
