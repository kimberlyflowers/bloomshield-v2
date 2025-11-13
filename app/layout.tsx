import './globals.css';

export const metadata = {
  title: 'BloomShield',
  description: 'Digital Content Protection Platform with Blockchain Timestamping',
};

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
