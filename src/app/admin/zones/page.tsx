'use client';

import { AppHeader, AppSidebar } from '@/components/dashboard-components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ZonesPage() {
  return (
    <div className="flex h-screen flex-row bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Zone Configuration</CardTitle>
                    <CardDescription>
                        This section is for detailed zone settings and management.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="h-[70vh] w-full rounded-md bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">Detailed zone configuration components will be displayed here.</p>
                     </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
