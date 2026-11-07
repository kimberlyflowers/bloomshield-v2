'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
  ownerWallet?: string;
  ipfsHash?: string;
  storagePath?: string;
}

interface CertificateModalProps {
  show: boolean;
  onClose: () => void;
  data: CertificateData;
  onNavigateToDashboard?: () => void;
}

export default function CertificateModal({ show, onClose, data, onNavigateToDashboard }: CertificateModalProps) {
  const [verifiedTransaction, setVerifiedTransaction] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const tx = data.blockchainTx || '';
  const verified = !!tx && verifiedTransaction === `${tx}:${data.legalHash}`;

  useEffect(() => {
    setVerifiedTransaction('');
    setDownloadError('');
    if (!show || !/^0x[a-f0-9]{64}$/i.test(tx) || !/^[a-f0-9]{64}$/i.test(data.legalHash)) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ txHash: tx, legalHash: data.legalHash });
    fetch(`/api/blockchain/timestamp?${params}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (result?.verification?.matchesFile && !controller.signal.aborted) {
          setVerifiedTransaction(`${tx}:${data.legalHash}`);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [show, tx, data.legalHash]);

  if (!show) return null;
  const verificationUrl = verified ? `https://polygonscan.com/tx/${tx}` : '';

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

${verified ? 'POLYGON TIMESTAMP VERIFIED' : 'POLYGON TIMESTAMP UNVERIFIED'}
Protected by BloomShield 🌸

Verification: ${verificationUrl || 'No confirmed Polygon timestamp'}
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

  const handleFileDownload = async () => {
    if (!data.storagePath) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const { data: file, error } = await getSupabaseBrowserClient()
        .storage.from('protected-files').download(data.storagePath);
      if (error || !file) throw new Error('The original file is unavailable to this workspace.');
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not download the file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!verificationUrl) return;
    const shareUrl = verificationUrl;
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
            {verified ? '✓ POLYGON TIMESTAMP VERIFIED' : 'POLYGON TIMESTAMP UNVERIFIED'}
          </div>
          <h1 className="text-3xl font-bold mb-2">Certificate of Protection</h1>
          <p className="text-base opacity-95">{verified ? 'The timestamp matches this file on Polygon.' : 'BloomShield could not confirm a Polygon timestamp for this file.'}</p>
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

          {/* Blockchain Record Section */}
          {(data.ownerWallet || data.ipfsHash) && (
            <div className="mb-8">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Blockchain Record</div>
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                {data.ownerWallet && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold">Owner Wallet</div>
                    <code className="text-xs font-mono text-gray-800 break-all bg-white p-3 rounded block">
                      {data.ownerWallet}
                    </code>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-semibold">Blockchain Transaction</div>
                  <code className="text-xs font-mono text-gray-800 break-all bg-white p-3 rounded block">
                    {data.blockchainTx}
                  </code>
                </div>
                {data.ipfsHash && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold">Metadata (IPFS)</div>
                    <code className="text-xs font-mono text-gray-800 break-all bg-white p-3 rounded block">
                      {data.ipfsHash}
                    </code>
                  </div>
                )}
              </div>
              {verified && <div className="bg-[#E8F5E9] border-l-4 border-green-500 p-4 rounded-lg mt-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">✓ Permanent Protection</p>
                <p className="text-xs text-gray-700">
                  This proof exists on the blockchain independent of BloomShield.
                </p>
              </div>}
            </div>
          )}

          {/* Protection Stamp */}
          {verified && <div
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

          }

          {/* BloomShield Branding */}
          <div className="text-center pt-6 border-t-2 border-gray-200 mt-6">
            <p className="text-xs text-gray-500 mb-1">Asset Protected by</p>
            <p className="text-lg text-[#FF8C42] font-bold">🌸 BloomShield</p>
          </div>
        </div>

        {data.storagePath && (
          <div className="px-6 pt-4">
            <button type="button" onClick={handleFileDownload} disabled={downloading}
              className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-gray-800">
              {downloading ? 'Downloading…' : 'Download original file'}
            </button>
            {downloadError && <p role="alert" className="mt-2 text-sm text-red-700">{downloadError}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-transparent">
          <button
            onClick={handleDownload}
            className="bg-white/95 backdrop-blur-md border-2 border-white/30 hover:border-[#FF8C42] hover:bg-white p-4 rounded-lg transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col items-center gap-2"
          >
            <div className="text-3xl text-[#FF8C42]">⬇</div>
            <div className="text-sm font-semibold text-gray-800">Download certificate</div>
          </button>
          <button
            onClick={handleShare}
            disabled={!verified}
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
