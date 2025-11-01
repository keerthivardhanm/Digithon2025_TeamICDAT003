'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Video, VideoOff, AlertTriangle, Loader2 } from 'lucide-react';
import type { InputSource } from './input-source-selector';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';


export interface AnalysisData {
  peopleCount: number;
  maleCount: number;
  femaleCount: number;
  densityLevel: 'low' | 'medium' | 'high';
}

interface VideoFeedProps {
  camera: { id: string; name: string; url: string; zoneId: string; };
  onAnalysisUpdate: (cameraId: string, data: AnalysisData) => void;
  onHighDensityAlert: (cameraName: string, zoneId: string, peopleCount: number) => void;
  onRemove: (cameraId: string) => void;
  isMuted?: boolean;
}

export function VideoFeed({ camera, onAnalysisUpdate, onHighDensityAlert, onRemove, isMuted = true }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const highDensityAlertSent = useRef(false);

  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model';


  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load models:", error);
        setError("Could not load analysis models.");
      }
    };
    loadModels();
  }, []);

  // Main effect to handle video stream and analysis
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !modelsLoaded) return;
    
    let isPlaying = false;
    
    const handlePlay = () => {
      isPlaying = true;
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      
      detectionInterval.current = setInterval(async () => {
        if (!video || video.paused || video.ended || !isPlaying) {
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const displaySize = { width: video.clientWidth, height: video.clientHeight };
        if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
           faceapi.matchDimensions(canvas, displaySize);
        }
       
        try {
          const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withAgeAndGender();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
          }

          let maleCount = 0;
          let femaleCount = 0;
          detections.forEach(d => {
            if (d.gender === 'male') maleCount++;
            if (d.gender === 'female') femaleCount++;
          });

          const peopleCount = detections.length;
          let densityLevel: AnalysisData['densityLevel'] = 'low';
          if (peopleCount > 10) densityLevel = 'high';
          else if (peopleCount > 4) densityLevel = 'medium';
          
          const analysisData: AnalysisData = {
            peopleCount,
            maleCount,
            femaleCount,
            densityLevel,
          };
          
          onAnalysisUpdate(camera.id, analysisData);
          
          if(densityLevel === 'high' && !highDensityAlertSent.current) {
              onHighDensityAlert(camera.name, camera.zoneId, peopleCount);
              highDensityAlertSent.current = true; // Set flag to prevent spamming alerts
              setTimeout(() => { highDensityAlertSent.current = false; }, 60000); // Reset after 1 minute
          }

        } catch (error) {
            console.error("Error during face detection:", error);
            setError("Analysis failed on this feed.");
            if (detectionInterval.current) clearInterval(detectionInterval.current);
        }
      }, 1000); // Increased interval for performance
    };
    
    const handlePause = () => {
        isPlaying = false;
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
        }
    }

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    // Attempt to play
    video.play().catch(e => {
        setError("Video autoplay failed. Please click play.");
        console.error("Autoplay error:", e);
    });

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [modelsLoaded, camera.id, camera.name, camera.zoneId, onAnalysisUpdate, onHighDensityAlert]);

  const getDensityBadge = (level: AnalysisData['densityLevel'] | undefined) => {
        if (!level) return null;
        const variant = {
            low: 'default',
            medium: 'secondary',
            high: 'destructive'
        }[level] || 'outline';
        
         const colorClass = {
            low: 'bg-green-500 hover:bg-green-600',
            medium: 'bg-yellow-500 hover:bg-yellow-600',
            high: 'bg-red-600 hover:bg-red-700'
        }[level] || '';

        return <Badge className={cn("capitalize", colorClass)}>{level}</Badge>;
    };

  return (
    <div className="relative w-full h-full bg-muted rounded-md overflow-hidden group/feed flex items-center justify-center text-center">
        {!camera.url ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <VideoOff className="h-10 w-10" />
                <p className="mt-2 text-sm font-semibold">Empty Feed Slot</p>
            </div>
        ) : error ? (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Feed Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        ) : (
            <>
                {!modelsLoaded && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
                        <Loader2 className="h-8 w-8 animate-spin mb-3" />
                        <p className="font-semibold">Loading Models...</p>
                    </div>
                 )}
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    playsInline
                    controls
                    loop
                    src={camera.url}
                    crossOrigin="anonymous"
                />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10 p-1 bg-black/30 rounded-md opacity-0 group-hover/feed:opacity-100 transition-opacity">
                   <div>
                     <h4 className="font-bold text-white text-sm drop-shadow-md">{camera.name}</h4>
                     <p className="text-white/90 text-xs drop-shadow-md">Zone: {camera.zoneId}</p>
                   </div>
                    <Button onClick={() => onRemove(camera.id)} size="sm" variant="destructive">
                        Remove
                    </Button>
                </div>
            </>
        )}
    </div>
  );
}
