'use client';

import { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Toast from '@/components/Toast';
import CertificateModal from '@/components/CertificateModal';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import LoginModal from '@/components/LoginModal';

export default function Home() {
  // Page navigation state
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Upload state (PRESERVED FROM ORIGINAL)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [legalHash, setLegalHash] = useState<string>('');
  const [contentHash, setContentHash] = useState<string>('');
  const [floralHash, setFloralHash] = useState<string>('');
  const [blockchainTx, setBlockchainTx] = useState<string>('');
  const [recordId, setRecordId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing overlay state
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Certificate modal state
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // PRESERVED: Supabase client initialization
  const getSupabaseClient = () => {
    if (typeof window === 'undefined') return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not set');
      return null;
    }

    try {
      if (typeof window !== 'undefined') {
        const { createClient } = require('@supabase/supabase-js');
        return createClient(supabaseUrl, supabaseKey);
      }
      return null;
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  };

  // PRESERVED: Hash generation function
  const generateHashes = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Legal Hash (SHA-256)
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const legal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Content Hash (Perceptual)
      const uint8Array = new Uint8Array(arrayBuffer);
      let simpleSum = 0;
      for (let i = 0; i < Math.min(uint8Array.length, 1000); i++) {
        simpleSum += uint8Array[i];
      }
      const content = '0x' + (simpleSum % 10000000000000000).toString(16).padStart(16, '0');

      // Floral Hash (Visual) - This will be the Asset ID
      const floral = '🌸 BS-' + legal.substring(0, 4) + '-' + legal.substring(4, 8) + '-' + legal.substring(8, 12);

      return { legal, content, floral };
    } catch (error) {
      console.error('Hash generation failed:', error);
      throw new Error('Failed to generate file hashes');
    }
  };

  // PRESERVED: Upload handler with UI enhancements
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      // Show processing overlay
      setShowProcessing(true);
      setProcessingStep(1);

      // Step 1: Generate Hashes
      setUploadStatus('Generating protection hashes...');
      const hashes = await generateHashes(selectedFile);
      setLegalHash(hashes.legal);
      setContentHash(hashes.content);
      setFloralHash(hashes.floral);

      setProcessingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Blockchain Timestamp
      setUploadStatus('⛓️ Creating blockchain timestamp...');
      setProcessingStep(3);

      let blockchainTransactionHash = '';
      let blockchainTimestamp = '';

      try {
        const response = await fetch('/api/blockchain/timestamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legalHash: hashes.legal,
            contentHash: hashes.content,
            floralHash: hashes.floral,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          blockchainTransactionHash = result.blockchain.transactionHash;
          blockchainTimestamp = new Date(result.blockchain.timestamp).toISOString();
          setBlockchainTx(blockchainTransactionHash);
        } else {
          throw new Error(result.error || 'Blockchain API failed');
        }
      } catch (blockchainError) {
        console.error('Blockchain call failed:', blockchainError);
        // Fallback to simulated transaction
        blockchainTransactionHash = `0xSIM${Math.random().toString(16).substr(2, 60)}`;
        blockchainTimestamp = new Date().toISOString();
        setBlockchainTx(blockchainTransactionHash);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Upload to Supabase Storage
      setUploadStatus('Uploading to secure storage...');
      setProcessingStep(4);

      const fileName = `${hashes.legal.slice(0, 16)}_${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('protected-files')
        .upload(fileName, selectedFile);

      if (uploadError && !uploadError.message.includes('already exists')) {
        throw uploadError;
      }

      // Step 4: Save to Database
      setUploadStatus('Saving protection record...');
      const { data: dbData, error: dbError } = await supabase
        .from('protected_files')
        .insert({
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          storage_path: uploadData?.path || fileName,
          legal_hash: hashes.legal,
          content_hash: hashes.content,
          floral_hash: hashes.floral,
          blockchain_tx: blockchainTransactionHash,
          blockchain_timestamp: blockchainTimestamp,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setRecordId(dbData.id);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep(5);

      // Prepare certificate data
      const certData = {
        assetId: hashes.floral,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'Unknown',
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        protectedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        creator: 'User', // This would come from auth in production
        email: 'user@example.com', // This would come from auth in production
        legalHash: hashes.legal,
        contentHash: hashes.content,
        floralHash: hashes.floral,
        blockchainTx: blockchainTransactionHash,
      };
      setCertificateData(certData);

      const successMessage = blockchainTransactionHash.startsWith('0xSIM')
        ? '✅ File protected successfully! ⚠️ Using simulated blockchain.'
        : '✅ File protected and stored successfully! ⛓️ Blockchain timestamp created!';

      setUploadStatus(successMessage);

      // Show toast
      showToastMessage('🎉 Your work is now protected!', 'success');

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      showToastMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setShowProcessing(false);
    }
  };

  // Helper function to show toast
  const showToastMessage = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      showToastMessage(`Selected: ${file.name}`, 'success');
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      showToastMessage('⚠️ Please enter a Shield ID or creator name', 'warning');
      return;
    }
    showToastMessage(`🔍 Searching for: ${searchQuery}`, 'success');
  };

  // Handle login button click - show modal
  const handleLogin = () => {
    setShowLoginModal(true);
  };

  // Handle actual login after method selection
  const handleLoginComplete = (method: 'google' | 'email' | 'facebook') => {
    setIsLoggedIn(true);
    setIsSidebarActive(true);
    setCurrentPage('dashboard');

    const methodNames = {
      google: 'Google',
      email: 'Email',
      facebook: 'Facebook'
    };

    showToastMessage(`🔐 Logged in with ${methodNames[method]}! Welcome to your Dashboard`, 'success');
  };

  // Handle navigation
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    showToastMessage(`📄 Navigated to ${page.charAt(0).toUpperCase() + page.slice(1)}`, 'success');
  };

  // Handle sidebar toggle
  const handleToggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  // Handle processing complete
  const handleProcessingComplete = () => {
    setShowProcessing(false);
    setShowCertificate(true);
  };

  // Handle navigate to dashboard from certificate
  const handleNavigateToDashboard = () => {
    setShowCertificate(false);
    if (!isLoggedIn) {
      handleLogin();
    } else {
      setCurrentPage('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Backdrop Overlay for mobile sidebar - only show when logged in */}
      {isLoggedIn && isSidebarActive && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[998] md:hidden"
          onClick={() => setIsSidebarActive(false)}
        />
      )}

      {/* Sidebar - only render when logged in */}
      {isLoggedIn && (
        <Sidebar
          isActive={isSidebarActive}
          onNavigate={handleNavigate}
          currentPage={currentPage}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-500 ease-in-out ${isLoggedIn && isSidebarActive ? 'ml-0 md:ml-[280px]' : 'ml-0'}`}>
        {/* Top Bar */}
        <TopBar
          onLogin={handleLogin}
          isLoggedIn={isLoggedIn}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Toast Notification */}
        <Toast
          message={toastMessage}
          type={toastType}
          show={showToast}
          onClose={() => setShowToast(false)}
        />

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 md:p-8">
            <div className="w-full max-w-6xl mx-auto">
              {/* Title */}
              <div className="text-center mb-8 md:mb-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-[#FF8C42] to-yellow-400 bg-clip-text text-transparent">
                  BloomShield
                </h1>
                <p className="text-lg md:text-xl text-gray-600 px-4">
                  Protect and verify creative ownership on the blockchain
                </p>
              </div>

              {/* Two Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Verify Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">🔍 Verify Content</h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Search by Shield ID or creator name to verify authentic ownership
                  </p>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="🌸 BS-a7f5-b3k9-c8m2"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none transition-colors mb-4"
                  />
                  <button
                    onClick={handleSearch}
                    className="w-full bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-bold py-2.5 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    SEARCH
                  </button>
                </div>

                {/* Upload Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">🛡️ Protect Your Work</h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Upload files to generate blockchain certificates and secure your creative work
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-zone mb-4 cursor-pointer"
                  >
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      {selectedFile
                        ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                        : 'Click to choose files or drag & drop'
                      }
                    </div>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className="w-full bg-[#FF8C42] hover:bg-[#ff7a2e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    PROTECT FILE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {currentPage === 'dashboard' && (
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#FF8C42]">
                <div className="text-gray-500 text-sm mb-2">Total Files Protected</div>
                <div className="text-4xl font-bold text-gray-800">{recordId || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#FF8C42]">
                <div className="text-gray-500 text-sm mb-2">Active Monitoring</div>
                <div className="text-4xl font-bold text-gray-800">0</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#FF8C42]">
                <div className="text-gray-500 text-sm mb-2">Open Cases</div>
                <div className="text-4xl font-bold text-gray-800">0</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#FF8C42]">
                <div className="text-gray-500 text-sm mb-2">License Requests</div>
                <div className="text-4xl font-bold text-gray-800">0</div>
              </div>
            </div>

            {/* Recent Protection */}
            {recordId && certificateData && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recently Protected</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div
                    className="file-card"
                    onClick={() => setShowCertificate(true)}
                  >
                    <div
                      className="w-full h-48 flex items-center justify-center text-6xl"
                      style={{
                        background: 'linear-gradient(135deg, #FFB5B5 0%, #FF9D5C 100%)',
                      }}
                    >
                      🎨
                    </div>
                    <div className="p-5">
                      <div className="font-semibold text-gray-800 mb-2">{certificateData.fileName}</div>
                      <div className="text-gray-500 text-sm mb-3">Protected just now</div>
                      <div className="font-mono bg-gray-100 p-3 rounded-lg text-xs text-gray-600 overflow-hidden text-ellipsis">
                        {certificateData.assetId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!recordId && (
              <div className="bg-white rounded-xl shadow-md p-16 text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-gray-500 text-lg mb-6">No files protected yet</p>
                <button
                  onClick={() => setCurrentPage('home')}
                  className="bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-bold py-3 px-8 rounded-lg transition-all"
                >
                  Protect Your First File
                </button>
              </div>
            )}
          </div>
        )}

        {/* OTHER PAGES - Placeholder */}
        {['marketplace', 'wallet', 'profile', 'settings', 'about'].includes(currentPage) && (
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8 capitalize">{currentPage}</h1>
            <div className="bg-white rounded-xl shadow-md p-16 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <p className="text-gray-500 text-lg">This section is coming soon!</p>
            </div>
          </div>
        )}
      </div>

      {/* Processing Overlay */}
      <ProcessingOverlay
        show={showProcessing}
        currentStep={processingStep}
        onComplete={handleProcessingComplete}
      />

      {/* Login Modal */}
      <LoginModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginComplete}
      />

      {/* Certificate Modal */}
      {certificateData && (
        <CertificateModal
          show={showCertificate}
          onClose={() => setShowCertificate(false)}
          data={certificateData}
          onNavigateToDashboard={handleNavigateToDashboard}
        />
      )}
    </div>
  );
}
