import type {Metadata} from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: 'VISION - Virtual Infrastructure Surveillance & Intelligence Optimization Network',
  description: 'Virtual Infrastructure Surveillance & Intelligence Optimization Network',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="vision-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
