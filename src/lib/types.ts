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
  type: 'manual' | 'auto' | 'sos';
  zoneId?: string;
  eventId: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
  senderId: string;
  status: 'resolved' | 'pending';
  timestamp: string; // ISO 8601 format
};

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
  assignedZones?: string[];
  eventId?: string;
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
  startAt: string; // ISO 8601 format
  endAt: string; // ISO 8601 format
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: Timestamp;
};

export type LatLngLiteral = {
    lat: number;
    lng: number;
}

export type SubZone = {
    id: string;
    name: string;
    polygon: LatLngLiteral[];
    volunteers?: string[];
}

export type Zone = {
  id: string;
  name: string;
  eventId: string;
  polygon: LatLngLiteral[];
  subzones?: SubZone[];
  capacity?: number;
  currentCount?: number;
  density?: number;
  intensity?: number;
};

export type SOSReport = {
    id: string;
    userId: string;
    zoneId: string;
    eventId: string;
    type: string;
    description: string;
    location: {
        lat: number;
        lng: number;
    };
    resolved: boolean;
    timestamp: string; // ISO 8601 format
};
