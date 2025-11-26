import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Prompt Armory | Cinematic AI Prompt Generator',
  description: 'Professional-grade prompt engineering for AI image and video generation. Build cinematic prompts for Midjourney, DALL-E, Runway, and more.',
  keywords: ['AI prompts', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'prompt engineering', 'AI art'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-black text-white antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
