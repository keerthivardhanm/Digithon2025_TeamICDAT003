'use client';

import * as React from 'react';
import type { ChartConfig } from '@/components/ui/chart';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  LayoutDashboard,
  LogOut,
  Map,
  MoreHorizontal,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

import type { Kpi } from '@/lib/types';
import { aiPredictionsData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';
import { signOutUser } from '@/firebase/auth';


const densityChartConfig = {
  A: { label: 'Zone A', color: 'hsl(var(--chart-1))' },
  B: { label: 'Zone B', color: 'hsl(var(--chart-2))' },
  C: { label: 'Zone C', color: 'hsl(var(--chart-3))' },
  D: { label: 'Zone D', color: 'hsl(var(--chart-4))' },
  E: { label: 'Zone E', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

const sosChartConfig = {
  incidents: {
    label: 'Incidents',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig

export function AppSidebar() {
  const { user, customClaims, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
        await signOutUser();
        toast({ title: 'Logged Out' });
        router.push('/login');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Logout Failed' });
    }
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/zones', label: 'Zones', icon: Map },
    { href: '/admin/alerts', label: 'Alerts', icon: Bell },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/team', label: 'Team', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return <div className="hidden lg:block w-64 border-r bg-card p-4"><p>Loading...</p></div>
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <span className="text-lg font-semibold">Flow-Track</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}>
                  <item.icon />
                  {item.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2">
              <Avatar className="size-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start truncate">
                <span className="font-semibold">{user?.displayName || user?.email || 'Admin User'}</span>
                <span className="text-xs text-muted-foreground capitalize">{customClaims?.role || 'Admin'}</span>
              </div>
              <MoreHorizontal className="ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="right" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className='mr-2' /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  // A simple way to get a title from the path
  const title = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <h1 className="hidden text-lg font-semibold capitalize md:block">{title === 'admin' ? 'Dashboard' : title}</h1>
      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden w-64 md:block">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search zones, events..." className="pl-8" />
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="size-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </div>
    </header>
  )
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <kpi.icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {kpi.changeType === 'increase' ? (
            <TrendingUp className="size-3 text-emerald-500" />
          ) : (
            <TrendingDown className="size-3 text-destructive" />
          )}
          <span
            className={cn(
              kpi.changeType === 'increase' ? 'text-emerald-500' : 'text-destructive'
            )}
          >
            {kpi.change}
          </span>
          vs last hour
        </p>
      </CardContent>
    </Card>
  )
}


export function AiPredictions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI-Driven Predictions</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {aiPredictionsData.map((pred) => (
                        <li key={pred.id} className="flex items-start gap-3">
                            <div className="mt-1">
                                <AlertTriangle className="size-5 text-warning" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{pred.prediction}</p>
                                <p className="text-sm text-muted-foreground">In {pred.time} min - Zone {pred.zone}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

export function DensityChart({ data }: { data: any[] }) {
    const [activeChart, setActiveChart] = React.useState<keyof typeof densityChartConfig | "all">("all");

    const handleLegendClick = (dataKey: any) => {
        if (typeof dataKey === 'string') {
             if (dataKey === activeChart) {
                setActiveChart("all");
             } else {
                setActiveChart(dataKey as keyof typeof densityChartConfig);
             }
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Crowd Density Over Time</CardTitle>
                <CardDescription>Last 60 seconds (Live)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={densityChartConfig} className="h-64 w-full">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'dataMax + 1']} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Legend verticalAlign="top" height={40} onClick={(e) => handleLegendClick(e.dataKey)} />
                        {Object.keys(densityChartConfig).map((zoneKey) => (
                            <Line 
                                key={zoneKey}
                                dataKey={zoneKey} 
                                type="monotone" 
                                stroke={densityChartConfig[zoneKey as keyof typeof densityChartConfig].color}
                                strokeWidth={2} 
                                dot={false} 
                                hide={activeChart !== 'all' && activeChart !== zoneKey}
                            />
                        ))}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export function SosChart() {
    // In a real app, this would be fetched from Firestore
    const sosChartData = [
        { zone: 'A', incidents: 5 },
        { zone: 'B', incidents: 8 },
        { zone: 'C', incidents: 12 },
        { zone: 'D', incidents: 3 },
        { zone: 'E', incidents: 7 },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>SOS Incidents by Zone</CardTitle>
                <CardDescription>Today's total incidents</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={sosChartConfig} className="h-64 w-full">
                    <BarChart data={sosChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="zone" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="incidents" fill="hsl(var(--destructive))" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export function AiSummaryGenerator() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Summary Generator</CardTitle>
                <CardDescription>Explain what happened in a specific zone over the last hour.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea placeholder="AI generated summary will appear here. For example: 'Zone C experienced a rapid increase in density around 3:30 PM, peaking at 4.2 people/m². One minor SOS alert was resolved within 5 minutes. Density has since stabilized.'" rows={4} />
            </CardContent>
            <CardFooter className="justify-end">
                <Button>
                    <Sparkles className="mr-2 size-4" />
                    Generate Summary
                </Button>
            </CardFooter>
        </Card>
    )
}
