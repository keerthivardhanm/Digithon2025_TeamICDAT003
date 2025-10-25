'use client';

import { MapView } from '@/components/map-view';
import { KpiCard, DensityChart, SosChart, AiPredictions, AiSummaryGenerator, AppHeader, AppSidebar } from '@/components/dashboard-components';
import { kpiData } from '@/lib/data';

export default function AdminDashboard() {
  return (
    <>
      <AppSidebar />
      <div className="flex h-full flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {kpiData.map((kpi) => (
                <KpiCard key={kpi.title} kpi={kpi} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-3">
                <MapView />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DensityChart />
              <SosChart />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AiPredictions />
                <AiSummaryGenerator />
            </div>
          </main>
        </div>
    </>
  );
}
