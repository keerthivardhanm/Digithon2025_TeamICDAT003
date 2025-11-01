'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bell, MessageSquare, QrCode, ShieldCheck, Users, MapPin, Siren, CheckCircle, Video } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import type { User as AppUser, SOSReport } from "@/lib/types"; // Renamed to avoid conflict with `useUser`'s `User`
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useMemo } from "react";

function OrganizerSosAlertFeed({ assignedZones }: { assignedZones: string[] }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const sosQuery = useMemo(() => {
    if (!firestore || !assignedZones || assignedZones.length === 0) return null;
    return query(
        collection(firestore, 'sosReports'),
        where('status', '==', 'dispatched'),
        where('zoneId', 'in', assignedZones),
        orderBy('timestamp', 'desc')
      )
  }, [firestore, assignedZones]);

  const { data: sosReports, loading } = useCollection<SOSReport>(sosQuery);

  const handleResolve = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'sosReports', id), { status: 'resolved' });
      toast({ title: 'SOS Resolved', description: `Report ${id} marked as resolved.` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not resolve SOS.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispatched SOS Alerts</CardTitle>
        <CardDescription>Incidents in your zones that require action.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading dispatched alerts...</p>
        ) : sosReports.length === 0 ? (
          <p className="text-muted-foreground">No dispatched alerts in your zones.</p>
        ) : (
          <div className="space-y-4">
            {sosReports.map(report => (
              <div key={report.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <Siren className={`h-5 w-5 ${report.type === 'Medical' ? 'text-amber-500' : 'text-red-500'}`} />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">
                            {report.type} in Zone {report.zoneId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {report.description || "No description provided."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                        </p>
                         <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Coords: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleResolve(report.id)}>
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        Mark as Resolved
                    </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizerDashboard() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => authUser ? doc(firestore!, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: organizer, loading: userLoading } = useDoc<AppUser>(userDocRef);
  
  const assignedZones = useMemo(() => organizer?.assignedZones || [], [organizer]);

  const volunteersQuery = useMemo(() => {
    if (!firestore || !assignedZones || assignedZones.length === 0) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'volunteer'),
      where('assignedZones', 'array-contains-any', assignedZones)
    )
  }, [firestore, assignedZones]);
  const { data: volunteers, loading: volunteersLoading } = useCollection<AppUser>(volunteersQuery);

  const dispatchedSosQuery = useMemo(() => {
    if (!firestore || !assignedZones || assignedZones.length === 0) return null;
    return query(
      collection(firestore, 'sosReports'),
      where('status', '==', 'dispatched'),
      where('zoneId', 'in', assignedZones)
    )
  }, [firestore, assignedZones]);
  const { data: activeAlerts, loading: alertsLoading } = useCollection<SOSReport>(dispatchedSosQuery);

  const totalPeopleInZones = 1204; // This should be derived from live zone data

  if (userLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-xl font-semibold">Organizer Dashboard</h1>
          {organizer && <span className="text-sm text-muted-foreground">Welcome, {organizer.name}</span>}
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">My Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{assignedZones.length}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {assignedZones.join(', ') || 'No zones assigned'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-destructive">{alertsLoading ? '...' : activeAlerts.length}</p>
                  <p className="text-xs text-muted-foreground">Incidents require attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Volunteers</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold">{volunteersLoading ? '...' : volunteers.length}</p>
                  <p className="text-xs text-muted-foreground">Team members in my zones</p>
                </CardContent>
              </Card>
                 <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Total People</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold">{totalPeopleInZones.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">In my zones</p>
                </CardContent>
              </Card>
            </div>
             <Card>
                <CardHeader>
                  <CardTitle>Operational Tools</CardTitle>
                  <CardDescription>Quick access to essential organizer functions.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <Button asChild variant="outline" className="h-20 flex-col gap-1">
                    <Link href="/organizer/raise-ticket">
                      <ShieldCheck className="h-6 w-6" />
                      <span>Raise Ticket</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col gap-1">
                    <Link href="/organizer/chat">
                      <MessageSquare className="h-6 w-6" />
                      <span>Team Chat</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-1">
                    <Users className="h-6 w-6" />
                    <span>View Volunteers</span>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col gap-1">
                    <Link href="/organizer/camera-feed">
                      <Video className="h-6 w-6" />
                      <span>Camera Feed</span>
                    </Link>
                  </Button>
                   <Button variant="outline" className="h-20 flex-col gap-1" disabled>
                    <Bell className="h-6 w-6" />
                    <span>Manage Alerts</span>
                  </Button>
                   <Button variant="outline" className="h-20 flex-col gap-1" disabled>
                    <QrCode className="h-6 w-6" />
                    <span>Scan Tickets</span>
                  </Button>
                </CardContent>
              </Card>
          </div>
          <div>
            <OrganizerSosAlertFeed assignedZones={assignedZones} />
          </div>
        </main>
      </div>
    </div>
  );
}
