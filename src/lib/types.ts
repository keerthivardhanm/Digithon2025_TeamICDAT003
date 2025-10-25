import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { Timestamp } from 'firebase/firestore';

export type Kpi = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
};

export type Alert = {
  id: string;
  zone: string;
  time: string;
  risk: 'High' | 'Medium' | 'Low';
};

export type SosAlert = Alert;

export type Prediction = {
    id: string;
    prediction: string;
    time: string;
    zone: string;
}

export type User = {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: 'admin' | 'organizer' | 'volunteer' | 'audience';
  assignedZones: string[];
  avatar?: string;
  location?: { 
    lat: number;
    lng: number;
  };
  status?: string;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  startAt: string;
  endAt: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: Timestamp;
};

export type SubZone = {
  id: string;
  parentId: string;
  name: string;
  polygon: { lat: number; lng: number }[];
  area: number;
  capacity?: number;
  overlay?: google.maps.Polygon;
};

export type Zone = {
  id: string;
  name: string;
  polygon: { lat: number; lng: number }[];
  area: number;
  capacity?: number;
  color: string;
  organizers?: string[];
  overlay?: google.maps.Polygon;
  subZones?: Record<string, SubZone>;
};
