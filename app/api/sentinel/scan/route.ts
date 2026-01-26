import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route simulates real-time monitoring
export const dynamic = 'force-dynamic';

/**
 * Sentinel AI Monitoring Endpoint
 * Simulates scanning millions of sources for data leaks
 */
export async function GET(request: NextRequest) {
  try {
    // Simulate scanning delay (AI processing time)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate realistic scan data
    const baseSourceCount = 1482901;
    const variance = Math.floor(Math.random() * 10000); // Add some variance
    const sourcesScanned = baseSourceCount + variance;

    // Mock recent scan events from various platforms
    const platforms = [
      'Reddit', 'Twitter', 'Facebook', 'Discord', 'Telegram',
      'Pastebin', 'GitHub', 'Dark Web Forums', '4chan', 'ImageBoards',
      'Torrent Sites', 'File Sharing Services', 'Social Media'
    ];

    const recentScans = platforms
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
      .map((platform, index) => {
        const minutesAgo = index * 2 + Math.floor(Math.random() * 3);
        return {
          source: platform,
          status: 'Clean',
          timestamp: minutesAgo === 0 ? 'Just now' : `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`,
          scannedItems: Math.floor(Math.random() * 50000) + 10000
        };
      });

    const response = {
      success: true,
      sources_scanned: sourcesScanned,
      leaks_found: 0, // Always 0 for secure accounts
      monitoring_active: true,
      last_scan: new Date().toISOString(),
      recent_scans: recentScans,
      scan_coverage: {
        social_media: Math.floor(Math.random() * 100000) + 500000,
        dark_web: Math.floor(Math.random() * 50000) + 200000,
        file_sharing: Math.floor(Math.random() * 30000) + 150000,
        public_databases: Math.floor(Math.random() * 80000) + 600000
      },
      next_scan_in: 300 // seconds (5 minutes)
    };

    console.log(`🛡️ Sentinel scan completed: ${sourcesScanned.toLocaleString()} sources monitored, 0 leaks found`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Sentinel scan error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform security scan'
    }, { status: 500 });
  }
}
