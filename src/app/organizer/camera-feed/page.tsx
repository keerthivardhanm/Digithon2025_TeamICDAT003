'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { User as AppUser, Zone } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputSource, InputSourceSelector } from '@/components/input-source-selector';
import { VideoFeed, AnalysisData } from '@/components/video-feed';
import { AnalysisResults } from '@/components/analysis-results';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CameraFeedPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => authUser ? doc(firestore!, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: organizer, loading: userLoading } = useDoc<AppUser>(userDocRef);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [inputSource, setInputSource] = useState<InputSource | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignedZones = useMemo(() => organizer?.assignedZones || [], [organizer]);

  const handleSourceSelect = async (source: InputSource) => {
    setInputSource(source);
    setError(null);
    setStream(null);
    setAnalysisData(null);

    try {
      if (source.type === 'webcam') {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
      } else if (source.type === 'screen') {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Error accessing media source:', err);
      setError(`Could not access ${source.type}. Please check permissions and try again.`);
      setInputSource(null);
    }
  };

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setInputSource(null);
    setStream(null);
    setAnalysisData(null);
  };

  return (
    <div className="flex flex-col h-full">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button asChild variant="ghost" size="icon" className="md:hidden">
            <Link href="/organizer">
                <ArrowLeft />
            </Link>
        </Button>
        <h1 className="text-xl font-semibold">Live Camera Feed</h1>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VideoFeed 
                source={inputSource} 
                stream={stream} 
                onStop={handleStop} 
                onError={setError}
                onAnalysisUpdate={setAnalysisData}
            />
          </div>
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Select a zone and input source to begin monitoring.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label htmlFor="zone-select">Your Assigned Zone</Label>
                        {userLoading ? <p>Loading zones...</p> : (
                             <Select onValueChange={setSelectedZoneId} value={selectedZoneId || ''}>
                                <SelectTrigger id="zone-select" disabled={!!inputSource}>
                                    <SelectValue placeholder="Select a zone to monitor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignedZones.length > 0 ? (
                                        assignedZones.map(zoneId => <SelectItem key={zoneId} value={zoneId}>Zone {zoneId}</SelectItem>)
                                    ) : (
                                        <SelectItem value="none" disabled>No zones assigned</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedZoneId && <InputSourceSelector onSourceSelect={handleSourceSelect} disabled={!!inputSource} />}
            
            <AnalysisResults data={analysisData} error={error} />
          </div>
        </div>
      </main>
    </div>
  );
}
