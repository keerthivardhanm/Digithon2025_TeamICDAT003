import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'CrowdSafe 360°',
  description: 'An AI-powered, real-time, geolocation-based event safety and crowd management platform for large-scale gatherings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
            {children}
        </FirebaseClientProvider>
        <Toaster />
        <Script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCFIFw8X7OTSOJ5lh-Z-HUxzNzbD2TYl-w&libraries=drawing,geometry,visualization&callback=Function.prototype"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
