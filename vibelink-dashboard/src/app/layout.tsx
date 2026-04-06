import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VibeLink Dashboard',
  description: 'Panel zarządzania twoim botem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}