'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// CONFIG
const TOTAL_AUDIENCE = 25000;
const TICK_MS = 1000;
const SMOOTH_ALPHA = 0.6;
const INTENSITY_SCALE = 6.0;

const initialZones = {
    A: { name: "Entrance", area: 150, weight: 0.12 },
    B: { name: "Work Area", area: 200, weight: 0.35 },
    C: { name: "Food Court", area: 100, weight: 0.18 },
    D: { name: "Stalls", area: 120, weight: 0.10 },
    E: { name: "Main Hall", area: 500, weight: 0.20 }
};

type ZoneData = {
    name: string;
    area: number;
    weight: number;
};

type ZoneState = {
    people: number;
    density: number;
    intensity: number;
    color: string;
    textColor: string;
};

const zoneKeys = Object.keys(initialZones);

// --- Color Helpers ---
function hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace('#', '');
    return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('');
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function lerpColor(hexA: string, hexB: string, t: number): string {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}

function luminanceFromHex(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map(v => v / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const GREEN = '#2ecc71', YELLOW = '#f1c40f', RED = '#e74c3c';
const T_LOW = 0.0, T_MED = 0.6, T_HIGH = 1.2;

function intensityToColor(it: number): string {
    if (it <= T_MED) {
        const t = T_MED === T_LOW ? 0 : (it - T_LOW) / (T_MED - T_LOW);
        return lerpColor(GREEN, YELLOW, Math.max(0, Math.min(1, t)));
    } else if (it <= T_HIGH) {
        const t = (it - T_MED) / (T_HIGH - T_MED);
        return lerpColor(YELLOW, RED, Math.max(0, Math.min(1, t)));
    } else {
        return RED;
    }
}

// --- React Component ---
export function CrowdDensityMonitor() {
    const [zoneStates, setZoneStates] = useState<Record<string, ZoneState>>(() => {
        const initial: Record<string, ZoneState> = {};
        zoneKeys.forEach(k => {
            initial[k] = { people: 0, density: 0, intensity: 0, color: '#f5f7fa', textColor: '#111' };
        });
        return initial;
    });

    const peopleRef = useRef<Record<string, number>>({});
    const prevPeopleRef = useRef<Record<string, number>>({});
    const smoothDensityRef = useRef<Record<string, number>>({});
    const smoothIntensityRef = useRef<Record<string, number>>({});
    const lastTickRef = useRef<number>(performance.now());
    
    // Initialization effect
    useEffect(() => {
        // Normalize weights and initialize people counts
        const sumW = zoneKeys.reduce((s, k) => s + initialZones[k as keyof typeof initialZones].weight, 0);
        let currentPeople: Record<string, number> = {};
        let remainder = TOTAL_AUDIENCE;

        zoneKeys.forEach(k => {
            const ideal = Math.floor(TOTAL_AUDIENCE * (initialZones[k as keyof typeof initialZones].weight / sumW));
            currentPeople[k] = ideal;
            remainder -= ideal;
        });

        for (let i = 0; i < remainder; i++) {
            currentPeople[zoneKeys[i % zoneKeys.length]]++;
        }
        
        peopleRef.current = currentPeople;

        // Initialize refs
        zoneKeys.forEach(k => {
            prevPeopleRef.current[k] = peopleRef.current[k];
            smoothDensityRef.current[k] = peopleRef.current[k] / initialZones[k as keyof typeof initialZones].area;
            smoothIntensityRef.current[k] = 0;
        });

        const tick = () => {
            // --- Simulation Logic ---
            const currentPeople = { ...peopleRef.current };
            
            // 1. Simulate Movement
            const outflows: Record<string, number> = {};
            let totalOut = 0;
            zoneKeys.forEach(k => {
                const mobility = 0.006;
                const variability = (Math.random() - 0.5) * 0.004;
                const frac = Math.max(0, mobility + variability);
                const outflow = Math.floor(currentPeople[k] * frac);
                outflows[k] = outflow;
                currentPeople[k] -= outflow;
                totalOut += outflow;
            });
            
            const weights = zoneKeys.map(k => initialZones[k as keyof typeof initialZones].weight + Math.random() * 0.02);
            const weightSum = weights.reduce((s, v) => s + v, 0);
            let allocated = 0;
            zoneKeys.forEach((k, idx) => {
                let add = Math.floor(totalOut * (weights[idx] / weightSum));
                currentPeople[k] += add;
                allocated += add;
            });
            
            let remainder = totalOut - allocated;
            while(remainder > 0){
                currentPeople[zoneKeys[Math.floor(Math.random() * zoneKeys.length)]]++;
                remainder--;
            }

            // 2. Small random events
            if (Math.random() < 0.06) {
                const target = zoneKeys[Math.floor(Math.random() * zoneKeys.length)];
                const surge = Math.floor(Math.random() * 120) + 50;
                currentPeople[target] += surge;
                let donors = zoneKeys.filter(z => z !== target).sort((a,b)=>currentPeople[b]-currentPeople[a]);
                let left = surge;
                for (let d of donors) {
                    const take = Math.min(left, Math.floor(currentPeople[d] * 0.01) + 1);
                    currentPeople[d] -= take;
                    left -= take;
                    if (left <= 0) break;
                }
            }

            // 3. Renormalize total
            const currentTotal = zoneKeys.reduce((s,k)=>s+currentPeople[k],0);
            let diff = TOTAL_AUDIENCE - currentTotal;
            if (diff > 0) {
                const sorted = [...zoneKeys].sort((a,b)=>currentPeople[a]-currentPeople[b]);
                for(let i=0; i<diff; i++) currentPeople[sorted[i % sorted.length]]++;
            } else if (diff < 0) {
                 const sorted = [...zoneKeys].sort((a,b)=>currentPeople[b]-currentPeople[a]);
                 let left = -diff;
                 for(let i=0; left > 0; i++){
                    const k = sorted[i % sorted.length];
                    if (currentPeople[k] > 0) { currentPeople[k]--; left--; }
                 }
            }

            peopleRef.current = currentPeople;

            // --- Compute and Render ---
            const now = performance.now();
            const dtSec = Math.max(0.001, (now - lastTickRef.current) / 1000);
            lastTickRef.current = now;

            const newStates: Record<string, ZoneState> = {};
            zoneKeys.forEach(k => {
                const zoneData = initialZones[k as keyof typeof initialZones];
                const p = peopleRef.current[k];
                const rawDensity = p / zoneData.area;
                const d = (SMOOTH_ALPHA * rawDensity) + ((1 - SMOOTH_ALPHA) * smoothDensityRef.current[k]);
                smoothDensityRef.current[k] = d;

                const rate = (p - prevPeopleRef.current[k]) / (zoneData.area * dtSec);
                const rawIntensity = d * (1 + INTENSITY_SCALE * Math.abs(rate));
                const it = (SMOOTH_ALPHA * rawIntensity) + ((1 - SMOOTH_ALPHA) * (smoothIntensityRef.current[k] || 0));
                smoothIntensityRef.current[k] = it;

                const bgColor = intensityToColor(it);
                
                newStates[k] = {
                    people: p,
                    density: d,
                    intensity: it,
                    color: bgColor,
                    textColor: luminanceFromHex(bgColor) > 0.55 ? '#111' : '#fff'
                };

                prevPeopleRef.current[k] = p;
            });

            setZoneStates(newStates);
        };
        
        // Initial render
        tick(); 
        
        const intervalId = setInterval(tick, TICK_MS);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Crowd Density Monitor</CardTitle>
                <CardDescription>
                    Real-time simulation for a sample audience of {TOTAL_AUDIENCE.toLocaleString()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div id="zones-container">
                    {zoneKeys.map(k => {
                        const zoneData = initialZones[k as keyof typeof initialZones];
                        const state = zoneStates[k];
                        if (!state) return null;
                        
                        return (
                            <div key={k} id={`zone-${k}`} className="density-zone" style={{ background: state.color, color: state.textColor }}>
                                <h3>Zone {k} — {zoneData.name}</h3>
                                <div className="stat" id={`stat-${k}`}>
                                     People: {state.people.toLocaleString()}<br />
                                     Density: {state.density.toFixed(3)} people/m²<br />
                                     Intensity: {state.intensity.toFixed(3)}
                                </div>
                                <div className="meta" id={`meta-${k}`}>Area: {zoneData.area} m²</div>
                            </div>
                        )
                    })}
                </div>
                 <div className="legend">
                    <span><span className="swatch" style={{ background: '#2ecc71' }}></span>Low</span>
                    <span><span className="swatch" style={{ background: '#f1c40f' }}></span>Medium</span>
                    <span><span className="swatch" style={{ background: '#e74c3c' }}></span>High</span>
                </div>
            </CardContent>
        </Card>
       
    );
}
