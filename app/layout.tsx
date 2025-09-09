import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCP Database Console',
  description: 'Natural language database query interface powered by MCP-DB Connector',
};

/**
 * Root Layout Component
 * Provides the base layout for all pages including TailwindCSS styles
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
