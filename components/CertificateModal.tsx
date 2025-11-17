'use client';

interface CertificateData {
  assetId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  protectedDate: string;
  creator: string;
  email: string;
  legalHash: string;
  contentHash: string;
  floralHash: string;
  blockchainTx: string;
}

interface CertificateModalProps {
  show: boolean;
  onClose: () => void;
  data: CertificateData;
  onNavigateToDashboard?: () => void;
}

export default function CertificateModal({ show, onClose, data, onNavigateToDashboard }: CertificateModalProps) {
  if (!show) return null;

  const handleDownload = () => {
    alert('Certificate download feature coming soon!');
  };

  const handleShare = () => {
    alert('Certificate sharing feature coming soon!');
  };

  const handleLicense = () => {
    alert('License request feature coming soon!');
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[2000] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[750px] max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl animate-slideUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-white/90 hover:bg-white w-11 h-11 rounded-full flex items-center justify-center text-2xl transition-all hover:rotate-90 hover:scale-110 z-20 shadow-lg"
        >
          ✕
        </button>

        {/* Header - Enhanced with brand styling */}
        <div className="relative px-8 py-12 text-center text-white overflow-hidden bg-gradient-to-br from-pink-400 via-[#FF8C42] to-pink-300">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 text-[120px] opacity-5">🌸</div>
          <div className="absolute bottom-0 left-0 text-[80px] opacity-5">🛡️</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[200px] opacity-5">🌸</div>

          <div className="relative z-10">
            <div className="inline-block bg-white text-[#FF8C42] px-8 py-3 rounded-full font-bold text-sm mb-6 shadow-lg">
              ✓ BLOOMSHIELD PROTECTED
            </div>
            <h1 className="text-4xl font-bold mb-3 drop-shadow-md">Certificate of Protection</h1>
            <p className="text-lg opacity-95 font-medium mb-3">This work is timestamped and authenticated on the blockchain</p>
            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
              <p className="text-sm opacity-95 leading-relaxed">
                ⚠️ Unauthorized reproduction, use, or distribution without creator consent or official licensing agreement may result in legal action
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-300px)]">

        {/* Body */}
        <div className="p-10">
          {/* Asset ID - Enhanced */}
          <div className="mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">🌸</span> Asset ID
            </div>
            <div className="p-7 rounded-2xl border-2 border-[#FFD4C4] text-center bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 shadow-inner">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Floral Signature</div>
              <div className="font-mono text-2xl font-bold text-[#FF8C42] tracking-wide bg-white/70 py-3 px-6 rounded-lg inline-block">
                {data.assetId}
              </div>
              <div className="text-xs text-gray-500 mt-3">Unique blockchain identifier</div>
            </div>
          </div>

          {/* File Information */}
          <div className="mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">File Information</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">File Name</div>
                <div className="text-base text-gray-800 font-semibold break-all">{data.fileName}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">File Type</div>
                <div className="text-base text-gray-800 font-semibold">{data.fileType}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">File Size</div>
                <div className="text-base text-gray-800 font-semibold">{data.fileSize}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Protected On</div>
                <div className="text-base text-gray-800 font-semibold">{data.protectedDate}</div>
              </div>
            </div>
          </div>

          {/* Creator Information */}
          <div className="mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Creator Information</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Creator</div>
                <div className="text-base text-gray-800 font-semibold">{data.creator}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Contact</div>
                <div className="text-base text-gray-800 font-semibold break-all">{data.email}</div>
              </div>
            </div>
          </div>

          {/* Hashes */}
          <div className="mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Protection Hashes</div>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Legal Hash (SHA-256)</div>
                <div className="font-mono text-xs text-gray-800 break-all">{data.legalHash}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Content Hash</div>
                <div className="font-mono text-xs text-gray-800 break-all">{data.contentHash}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Floral Hash</div>
                <div className="font-mono text-xs text-gray-800 break-all">{data.floralHash}</div>
              </div>
            </div>
          </div>

          {/* Protection Stamp - Enhanced */}
          <div className="text-center p-8 rounded-2xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-inner">
            <div className="text-6xl mb-3 animate-pulse">🛡️</div>
            <div className="text-2xl font-bold text-green-800 mb-2">AUTHENTICITY VERIFIED</div>
            <div className="text-sm text-green-700 font-medium mb-3">
              Protected on Polygon Blockchain
            </div>
            <div className="bg-white/80 p-4 rounded-lg border border-green-200">
              <div className="text-xs text-gray-500 mb-1 font-semibold">Transaction Hash</div>
              <div className="font-mono text-xs text-green-800 break-all">
                {data.blockchainTx}
              </div>
              {!data.blockchainTx.startsWith('0xSIM') && (
                <a
                  href={`https://polygonscan.com/tx/${data.blockchainTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs text-[#FF8C42] hover:text-[#ff7a2e] font-semibold hover:underline"
                >
                  View on PolygonScan →
                </a>
              )}
              {data.blockchainTx.startsWith('0xSIM') && (
                <div className="mt-2 text-xs text-amber-600 font-semibold">
                  ⚠️ Demo Mode - Configure blockchain for real transactions
                </div>
              )}
            </div>
          </div>

          {/* BloomShield Branding - Enhanced */}
          <div className="text-center pt-8 border-t-2 border-gray-200 mt-8">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Secured by</p>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-[#FF8C42] to-yellow-400 bg-clip-text text-transparent mb-1">
              🌸 BloomShield
            </div>
            <p className="text-xs text-gray-400">Blockchain-Powered Creative Protection</p>
          </div>
        </div>
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="grid grid-cols-3 gap-3 p-6 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
          <button
            onClick={handleDownload}
            className="bg-white border-2 border-gray-200 hover:border-[#FF8C42] hover:bg-gradient-to-br hover:from-pink-50 hover:to-orange-50 p-5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-2 group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">📥</div>
            <div className="text-xs font-bold text-gray-700 group-hover:text-[#FF8C42]">Download</div>
          </button>
          <button
            onClick={handleShare}
            className="bg-white border-2 border-gray-200 hover:border-[#FF8C42] hover:bg-gradient-to-br hover:from-pink-50 hover:to-orange-50 p-5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-2 group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">📤</div>
            <div className="text-xs font-bold text-gray-700 group-hover:text-[#FF8C42]">Share</div>
          </button>
          <button
            onClick={handleLicense}
            className="bg-white border-2 border-gray-200 hover:border-[#FF8C42] hover:bg-gradient-to-br hover:from-pink-50 hover:to-orange-50 p-5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-2 group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">📝</div>
            <div className="text-xs font-bold text-gray-700 group-hover:text-[#FF8C42]">License</div>
          </button>
        </div>

        {/* View in Dashboard - Enhanced */}
        {onNavigateToDashboard && (
          <div className="text-center px-6 pb-6 -mt-3 bg-gradient-to-br from-gray-50 to-white">
            <button
              onClick={onNavigateToDashboard}
              className="text-[#FF8C42] hover:text-[#ff7a2e] font-bold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all group"
            >
              <span className="group-hover:translate-x-1 transition-transform">→</span>
              <span className="group-hover:underline">View asset in Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
