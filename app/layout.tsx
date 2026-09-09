import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { aestheticBootstrap } from '@/lib/aesthetics';
import './globals.css';
import './aesthetics.css';
export const metadata: Metadata = {
  title: { default: 'JobTrack — Your next chapter', template: '%s · JobTrack' },
  description:
    'A clear view of your job search. Track applications, interviews, and offers in one private workspace.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: aestheticBootstrap }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
