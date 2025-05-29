import type { Metadata } from "next";
import { Playfair_Display, Lobster, Inter } from 'next/font/google';
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';

// --- Font Instantiation (Your setup is correct) ---
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: "--font-playfair",
  display: 'swap',
});

const lobster = Lobster({
    subsets: ['latin'],
    weight: ['400'],
    variable: '--font-lobster',
    display: 'swap',
});

const inter = Inter({ subsets: ['latin'] });

// Add console log to verify font loading
console.log('Lobster font variable:', lobster.variable);

// --- Metadata (Your setup is correct) ---
export const metadata: Metadata = {
  title: 'Go Jumping Jack - Travel Made Easy',
  description: 'Find and book the best travel deals with Go Jumping Jack',
  icons: {
    icon: [
      { rel: 'icon', url: '/GJJ_Jack_blue.png' },
      { rel: 'icon', url: '/GJJ_Jack_blue.png', sizes: '32x32', type: 'image/png' },
      { rel: 'icon', url: '/GJJ_Jack_blue.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/GJJ_Jack_blue.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/GJJ_Jack_blue.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/GJJ_Jack_blue.png'
      }
    ]
  },
  manifest: '/manifest.json'
};

// --- Root Layout Component (MODIFIED) ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/GJJ_Jack_blue.png" />
        <link rel="apple-touch-icon" href="/GJJ_Jack_blue.png" />
      </head>
      <body
        className={`
            ${playfair.variable}
            ${lobster.variable}
            ${GeistSans.variable}
            ${GeistMono.variable}
            ${inter.className}
            antialiased
            font-sans
            flex flex-col min-h-screen bg-gray-50
        `}
      >
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}