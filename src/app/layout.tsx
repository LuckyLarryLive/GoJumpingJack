// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Lobster } from 'next/font/google';
// Corrected Geist Imports (paths are correct)
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Instantiate Playfair and Lobster (These ARE functions)
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

// NO NEED TO CALL GeistSans or GeistMono - they are already the font objects
// const geistSans = GeistSans({...}); // <- Incorrect
// const geistMono = GeistMono({...}); // <- Incorrect


export const metadata: Metadata = {
  title: "GoJumpingJack - Real Travel Deals",
  description: "Discover real travel deals powered by people and AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
            ${playfair.variable}
            ${lobster.variable}
            ${GeistSans.variable}   {/* Use directly from import */}
            ${GeistMono.variable}   {/* Use directly from import */}
            antialiased
            font-sans
        `}
      >
        {children}
      </body>
    </html>
  );
}