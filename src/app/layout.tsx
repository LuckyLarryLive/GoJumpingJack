import type { Metadata } from "next";
import { Playfair_Display, Lobster } from 'next/font/google';
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Import Header and Footer components (adjust paths if needed)
import Header from '@/components/Header'; // Assuming Header is in components
import Footer from '@/components/Footer'; // Assuming Footer is in components

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

// --- Metadata (Your setup is correct) ---
export const metadata: Metadata = {
  title: "GoJumpingJack - Real Travel Deals",
  description: "Discover real travel deals powered by people and AI.",
};

// --- Root Layout Component (MODIFIED) ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
            ${playfair.variable}   {/* Make Playfair available */}
            ${lobster.variable}   {/* Make Lobster available */}
            ${GeistSans.variable} {/* Make Geist Sans available */}
            ${GeistMono.variable}  {/* Make Geist Mono available */}
            antialiased           {/* Keep antialiasing */}
            font-sans             {/* Base font class (Tailwind will use its config) */}
            flex flex-col min-h-screen bg-gray-50 {/* ADDED: Flex layout for sticky footer */}
        `}
      >
        <Header /> {/* ADDED: Header included on all pages */}
        <main className="flex-grow"> {/* ADDED: Main content area that grows */}
          {children} {/* Page content goes here */}
        </main>
        <Footer /> {/* ADDED: Footer included on all pages */}
      </body>
    </html>
  );
}