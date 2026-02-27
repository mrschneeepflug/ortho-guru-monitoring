import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/providers/query-provider';
import { PatientAuthProvider } from '@/providers/patient-auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyOrtho - Patient Portal',
  description: 'Monitor your orthodontic treatment progress',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0077B6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <PatientAuthProvider>
            {children}
          </PatientAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
