'use client';

import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Polygon } from "@thirdweb-dev/chains";

export const metadata = {
  title: 'BloomShield',
  description: 'Digital Content Protection Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThirdwebProvider
          activeChain={Polygon}
          clientId="your-client-id" // We'll get this next
        >
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
