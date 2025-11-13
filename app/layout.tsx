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
          clientId="c31c83cc19b0b7b3124743f28b2d3b26" // We'll get this next
        >
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
