'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { VideoOff, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputSource } from './input-source-selector';


export type AnalysisData = {
  peopleCount: number;
  maleCount: number;
  femaleCount: number;
  densityLevel: 'low' | 'medium' | 'high';
};

interface VideoFeedProps {
  source: InputSource | null;
  stream: MediaStream | null;
  onStop: () => void;
  onError: (error: string | null) => void;
  onAnalysisUpdate: (data: AnalysisData | null) => void;
  children?: React.ReactNode;
}

export function VideoFeed({ source, stream, onStop, onError, onAnalysisUpdate, children }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

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
        onError("Could not load analysis models.");
      }
    };
    loadModels();
  }, [onError]);

  // Main effect to handle video stream and analysis
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const cleanup = () => {
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
        }
        // The parent component is responsible for stopping the stream.
        if (video && video.src.startsWith('blob:')) {
            URL.revokeObjectURL(video.src);
        }
        video.src = "";
        video.srcObject = null;
    };

    if (!source) {
        cleanup();
        onAnalysisUpdate(null);
        return;
    }
    
    const startAnalysis = () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);

      detectionInterval.current = setInterval(async () => {
        if (!video || video.paused || video.ended) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const displaySize = { width: video.clientWidth, height: video.clientHeight };
        if (displaySize.width === 0 || displaySize.height === 0) return;
        
        faceapi.matchDimensions(canvas, displaySize);
       
        try {
          const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withAgeAndGender();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
          }

          const peopleCount = detections.length;
          const maleCount = detections.filter(d => d.gender === 'male').length;
          const femaleCount = peopleCount - maleCount;
          
          let densityLevel: AnalysisData['densityLevel'] = 'low';
          if (peopleCount > 20) densityLevel = 'high';
          else if (peopleCount > 8) densityLevel = 'medium';
          
          onAnalysisUpdate({ peopleCount, maleCount, femaleCount, densityLevel });

        } catch (error) {
            console.error("Error during face detection:", error);
            // Don't spam errors in UI
            // onError("Analysis failed on this feed.");
            if (detectionInterval.current) clearInterval(detectionInterval.current);
        }
      }, 1500); // Slower interval for better performance
    };

    const loadSource = () => {
        cleanup();
        setIsLoading(true);
        onError(null);

        try {
            if (stream) {
                video.srcObject = stream;
            } else if (source.type === 'url' && typeof source.content === 'string') {
                video.src = source.content;
                video.crossOrigin = 'anonymous';
            } else if (source.type === 'file' && source.content instanceof File) {
                video.src = URL.createObjectURL(source.content);
            } else {
                setIsLoading(false);
                return;
            }

            video.onloadedmetadata = () => {
                video.play().catch(e => {
                    console.warn("Autoplay was blocked:", e);
                    onError("Autoplay blocked. Please press play on the video.");
                });
            };

            video.onplay = () => {
                setIsLoading(false);
                if (modelsLoaded) {
                    startAnalysis();
                }
            };
            
            video.onerror = () => {
                const errorMessage = `Failed to load video from ${source.type}. Check URL or file format.`;
                console.error(errorMessage, video.error);
                onError(errorMessage);
                setIsLoading(false);
            };

            video.onended = onStop;

        } catch (err) {
            console.error("Error setting up video source:", err);
            onError("Failed to load the selected video source.");
            setIsLoading(false);
        }
    };
    
    loadSource();

    return cleanup;
    
  }, [source, stream, modelsLoaded, onAnalysisUpdate, onError, onStop]);
    

  const renderOverlay = () => {
      if (isLoading) {
          return (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p className="font-semibold">Loading Feed...</p>
            </div>
          );
      }
      if (!modelsLoaded && source) {
          return (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p className="font-semibold">Loading Analysis Models...</p>
            </div>
          );
      }
      return null;
  }

  return (
    <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden group/feed flex items-center justify-center text-center">
        {renderOverlay()}
        {!source && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <VideoOff className="h-10 w-10" />
                <p className="mt-2 font-semibold">No video source selected</p>
                <p className="text-sm">Select an input source to begin monitoring.</p>
            </div>
        )}
        <video
            ref={videoRef}
            className={cn("w-full h-full object-cover", !source && "hidden")}
            muted
            playsInline
            controls={!!(source && (source.type === 'file' || source.type === 'url'))}
            loop={!!(source && (source.type === 'file' || source.type === 'url'))}
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        {children}
    </div>
  );
}
