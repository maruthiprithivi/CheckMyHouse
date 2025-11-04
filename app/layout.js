import './globals.css';

export const metadata = {
  title: 'CheckMyHouse - ClickHouse Database Explorer',
  description: 'Visual database explorer and query analyzer for ClickHouse',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
