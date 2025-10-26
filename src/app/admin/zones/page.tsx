
'use client';
import { AppHeader, AppSidebar } from '@/components/dashboard-components';

export default function ZonesPage() {
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
           <iframe src="/zones-map.html" style={{ width: '100%', height: 'calc(100vh - 56px)', border: 'none' }} />
        </main>
      </div>
    </div>
  );
}
