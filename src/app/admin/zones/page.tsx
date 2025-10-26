'use client';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { ZoneMapEditor } from '@/components/zones/zone-map-editor';

export default function ZonesPage() {
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
           <ZoneMapEditor />
        </main>
      </div>
    </div>
  );
}
