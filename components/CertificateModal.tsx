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
    // Create a text file with certificate details
    const certificateText = `
BLOOMSHIELD CERTIFICATE OF PROTECTION
=====================================

Asset ID: ${data.assetId}
File Name: ${data.fileName}
File Type: ${data.fileType}
File Size: ${data.fileSize}
Protected On: ${data.protectedDate}

CREATOR INFORMATION
-------------------
Creator: ${data.creator}
Contact: ${data.email}

PROTECTION HASHES
-----------------
Legal Hash (SHA-256): ${data.legalHash}
Content Hash: ${data.contentHash}
Floral Hash: ${data.floralHash}

BLOCKCHAIN VERIFICATION
-----------------------
Transaction: ${data.blockchainTx}

AUTHENTICITY VERIFIED ✓
This work is timestamped and authenticated on the blockchain.
Protected by BloomShield 🌸

For verification, visit: https://bloomshield.com/verify/${data.assetId.replace('🌸 ', '')}
`;

    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BloomShield_Certificate_${data.fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareUrl = `https://bloomshield.com/verify/${data.assetId.replace('🌸 ', '')}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('✓ Certificate link copied to clipboard!\n\n' + shareUrl);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      alert('Share this verification link:\n\n' + shareUrl);
    }
  };

  const handleLicense = () => {
    const subject = encodeURIComponent(`License Request for ${data.fileName}`);
    const body = encodeURIComponent(
`Hi ${data.creator},

I'd like to request a license for your work:

Asset ID: ${data.assetId}
File Name: ${data.fileName}
Protected Date: ${data.protectedDate}

Please let me know the licensing terms and pricing options available.

Thank you!`
    );
    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-[90%] max-w-[700px] max-h-[90vh] rounded-2xl overflow-y-auto shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all hover:rotate-90 z-10"
        >
          ×
        </button>

        {/* Header */}
        <div
          className="px-8 py-12 text-center text-white relative"
          style={{
            background: 'linear-gradient(135deg, #FFB5B5 0%, #FF9D5C 100%)',
          }}
        >
          <div className="inline-block bg-white text-[#FF8C42] px-6 py-2 rounded-full font-bold text-sm mb-4">
            ✓ BLOOMSHIELD PROTECTED
          </div>
          <h1 className="text-3xl font-bold mb-2">Certificate of Protection</h1>
          <p className="text-base opacity-95">This work is timestamped and authenticated</p>
          <p className="text-sm opacity-90 mt-2">
            Unauthorized reproduction, use, or distribution without creator consent or official licensing agreement may result in legal action
          </p>
        </div>

        {/* Body */}
        <div className="p-10">
          {/* Asset ID */}
          <div className="mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Asset ID</div>
            <div
              className="p-6 rounded-xl border-2 text-center"
              style={{
                background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE5D9 100%)',
                borderColor: '#FFD4C4',
              }}
            >
              <div className="text-sm text-gray-600 mb-2">Floral Signature</div>
              <div className="font-mono text-xl font-bold text-[#FF8C42] tracking-wide">
                {data.assetId}
              </div>
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

          {/* Protection Stamp */}
          <div
            className="text-center p-6 rounded-xl border-2"
            style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              borderColor: '#81C784',
            }}
          >
            <div className="text-5xl mb-2">🛡️</div>
            <div className="text-lg font-bold text-green-800">AUTHENTICITY VERIFIED</div>
            <div className="text-sm text-green-600 mt-1">
              Blockchain TX: {data.blockchainTx.slice(0, 20)}...
            </div>
          </div>

          {/* BloomShield Branding */}
          <div className="text-center pt-6 border-t-2 border-gray-200 mt-6">
            <p className="text-xs text-gray-500 mb-1">Asset Protected by</p>
            <p className="text-lg text-[#FF8C42] font-bold">🌸 BloomShield</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-transparent">
          <button
            onClick={handleDownload}
            className="bg-white/95 backdrop-blur-md border-2 border-white/30 hover:border-[#FF8C42] hover:bg-white p-4 rounded-lg transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col items-center gap-2"
          >
            <div className="text-3xl text-[#FF8C42]">⬇</div>
            <div className="text-sm font-semibold text-gray-800">Download</div>
          </button>
          <button
            onClick={handleShare}
            className="bg-white/95 backdrop-blur-md border-2 border-white/30 hover:border-[#FF8C42] hover:bg-white p-4 rounded-lg transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col items-center gap-2"
          >
            <div className="text-3xl text-[#FF8C42]">⎙</div>
            <div className="text-sm font-semibold text-gray-800">Share</div>
          </button>
          <button
            onClick={handleLicense}
            className="bg-white/95 backdrop-blur-md border-2 border-white/30 hover:border-[#FF8C42] hover:bg-white p-4 rounded-lg transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col items-center gap-2"
          >
            <div className="text-3xl text-[#FF8C42]">✎</div>
            <div className="text-sm font-semibold text-gray-800">Request License</div>
          </button>
        </div>

        {/* View in Dashboard */}
        {onNavigateToDashboard && (
          <div className="text-center px-6 pb-6 -mt-2">
            <button
              onClick={onNavigateToDashboard}
              className="text-[#FF8C42] font-semibold text-sm inline-flex items-center gap-1 hover:underline"
            >
              <span>→</span> View asset in Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
