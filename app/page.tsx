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

  // Dashboard submenu state
  const [dashboardSection, setDashboardSection] = useState('overview');

  // Wallet submenu state
  const [walletSection, setWalletSection] = useState('overview');

  // Wallet card color state
  const [cardColor, setCardColor] = useState('blush');

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
    // Don't auto-navigate - stay on current page
    // Don't auto-open sidebar - let user open it via hamburger menu

    const methodNames = {
      google: 'Google',
      email: 'Email',
      facebook: 'Facebook'
    };

    showToastMessage(`🔐 Logged in with ${methodNames[method]}! Welcome to BloomShield`, 'success');
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
            <div className="w-full max-w-6xl">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
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
          <div className="flex h-[calc(100vh-70px)] bg-gray-50">
            {/* Dashboard Submenu */}
            <div className="w-60 bg-white border-r border-gray-200 p-8 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setDashboardSection('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all border-l-3 ${
                    dashboardSection === 'overview'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setDashboardSection('files')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    dashboardSection === 'files'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  My Files
                </button>
                <button
                  onClick={() => setDashboardSection('monitoring')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                    dashboardSection === 'monitoring'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Monitoring
                  <span className="text-xs bg-orange-100 text-[#FF8C42] px-2 py-0.5 rounded-full font-bold">PRO</span>
                </button>
                <button
                  onClick={() => setDashboardSection('cases')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                    dashboardSection === 'cases'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Cases
                  <span className="text-xs bg-orange-100 text-[#FF8C42] px-2 py-0.5 rounded-full font-bold">PRO</span>
                </button>
                <button
                  onClick={() => setDashboardSection('licenses')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    dashboardSection === 'licenses'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  License Requests
                </button>
              </nav>
            </div>

            {/* Dashboard Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* OVERVIEW SECTION */}
              {dashboardSection === 'overview' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Overview</h1>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#FF8C42]">
                      <div className="text-gray-500 text-sm mb-2">Total Files Protected</div>
                      <div className="text-4xl font-bold text-gray-800">{recordId || 24}</div>
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
                      <div className="text-4xl font-bold text-gray-800">3</div>
                    </div>
                  </div>

                  {/* Recent Files */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Files</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {certificateData && (
                      <div className="file-card cursor-pointer" onClick={() => setShowCertificate(true)}>
                        <div className="w-full h-48 flex items-center justify-center text-6xl bg-gradient-to-br from-pink-200 to-orange-300">
                          🎨
                        </div>
                        <div className="p-5">
                          <div className="font-semibold text-gray-800 mb-2">{certificateData.fileName}</div>
                          <div className="text-gray-500 text-sm mb-3">Protected just now</div>
                          <div className="font-mono bg-gray-100 p-3 rounded-lg text-xs text-gray-600">{certificateData.assetId}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MY FILES SECTION */}
              {dashboardSection === 'files' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">My Files</h1>
                  <p className="text-gray-600 mb-8">All your protected files in one place</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificateData && (
                      <div className="file-card cursor-pointer" onClick={() => setShowCertificate(true)}>
                        <div className="w-full h-48 flex items-center justify-center text-6xl bg-gradient-to-br from-pink-200 to-orange-300">
                          🎨
                        </div>
                        <div className="p-5">
                          <div className="font-semibold text-gray-800 mb-2">{certificateData.fileName}</div>
                          <div className="text-gray-500 text-sm mb-3">Protected just now</div>
                          <div className="font-mono bg-gray-100 p-3 rounded-lg text-xs text-gray-600">{certificateData.assetId}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MONITORING SECTION */}
              {dashboardSection === 'monitoring' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Monitoring</h1>

                  <div className="bg-gradient-to-r from-pink-500 via-[#FF8C42] to-yellow-400 rounded-2xl p-12 text-center text-white shadow-lg">
                    <h3 className="text-3xl font-bold mb-4">🔍 Unlock Advanced Monitoring</h3>
                    <p className="text-xl mb-8 opacity-95">Track your content across the web and get alerts when copies are detected</p>
                    <button className="bg-white text-[#FF8C42] font-bold py-4 px-10 rounded-lg hover:shadow-xl transition-all text-lg">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {/* CASES SECTION */}
              {dashboardSection === 'cases' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Cases</h1>

                  <div className="bg-gradient-to-r from-pink-500 via-[#FF8C42] to-yellow-400 rounded-2xl p-12 text-center text-white shadow-lg">
                    <h3 className="text-3xl font-bold mb-4">⚖️ Unlock Case Management</h3>
                    <p className="text-xl mb-8 opacity-95">Manage infringement cases and work with legal partners to protect your rights</p>
                    <button className="bg-white text-[#FF8C42] font-bold py-4 px-10 rounded-lg hover:shadow-xl transition-all text-lg">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {/* LICENSE REQUESTS SECTION */}
              {dashboardSection === 'licenses' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">License Requests</h1>
                  <p className="text-gray-600 mb-8">Manage incoming licensing requests for your work</p>

                  <div className="bg-white rounded-xl shadow-md p-16 text-center">
                    <div className="text-6xl mb-4">💼</div>
                    <p className="text-gray-500 text-lg">No license requests yet</p>
                    <p className="text-gray-400 text-sm mt-2">When someone requests to license your work, it will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WALLET PAGE */}
        {currentPage === 'wallet' && (
          <div className="flex h-[calc(100vh-70px)] bg-gray-50">
            {/* Wallet Submenu */}
            <div className="w-60 bg-white border-r border-gray-200 p-8 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Wallet</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setWalletSection('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    walletSection === 'overview'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setWalletSection('cards')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    walletSection === 'cards'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setWalletSection('transactions')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    walletSection === 'transactions'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setWalletSection('deposit')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    walletSection === 'deposit'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Direct Deposit
                </button>
                <button
                  onClick={() => setWalletSection('settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    walletSection === 'settings'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Wallet Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* OVERVIEW SECTION */}
              {walletSection === 'overview' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Overview</h1>

                  {/* Balance Display */}
                  <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                    <div className="text-gray-500 text-sm mb-2">Available Balance</div>
                    <div className="text-5xl font-bold text-gray-800 mb-2">$0.00</div>
                    <div className="text-gray-600 text-sm">Total earnings: $0.00</div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button className="bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-semibold py-4 px-6 rounded-lg transition-all">
                      + Add Money
                    </button>
                    <button className="bg-white border-2 border-[#FF8C42] text-[#FF8C42] hover:bg-orange-50 font-semibold py-4 px-6 rounded-lg transition-all">
                      Withdraw
                    </button>
                  </div>

                  {/* Recent Transactions */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Transactions</h2>
                  <div className="bg-white rounded-xl shadow-md p-16 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                </div>
              )}

              {/* CARDS SECTION */}
              {walletSection === 'cards' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">BloomCard</h1>

                  {/* 3D Credit Card */}
                  <div
                    className={`w-full max-w-md h-64 rounded-2xl p-8 shadow-2xl mb-8 cursor-pointer transition-all hover:scale-105 ${
                      cardColor === 'blush' ? 'bg-gradient-to-br from-pink-300 to-pink-200' :
                      cardColor === 'black' ? 'bg-gradient-to-br from-gray-800 to-gray-900' :
                      'bg-gradient-to-br from-orange-400 to-pink-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-12 h-10 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg"></div>
                      <div className="text-white font-bold text-xl opacity-90">🌸 Bloom</div>
                    </div>
                    <div className="text-white font-mono text-2xl tracking-wider mb-8">•••• •••• •••• 4242</div>
                    <div className="flex justify-between text-white">
                      <div>
                        <div className="text-xs opacity-75 mb-1">CARD HOLDER</div>
                        <div className="font-semibold">SARAH JOHNSON</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-75 mb-1">EXPIRES</div>
                        <div className="font-mono font-semibold">12/28</div>
                      </div>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Card Color</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setCardColor('blush')}
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 to-pink-200 ${
                          cardColor === 'blush' ? 'ring-4 ring-[#FF8C42] ring-offset-2' : ''
                        }`}
                      />
                      <button
                        onClick={() => setCardColor('black')}
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 ${
                          cardColor === 'black' ? 'ring-4 ring-[#FF8C42] ring-offset-2' : ''
                        }`}
                      />
                      <button
                        onClick={() => setCardColor('orange')}
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 ${
                          cardColor === 'orange' ? 'ring-4 ring-[#FF8C42] ring-offset-2' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="bg-white rounded-xl shadow-md p-8 mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Card Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-gray-500 text-sm mb-1">Card Number</div>
                        <div className="font-semibold">•••• •••• •••• 4242</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm mb-1">CVV</div>
                        <div className="font-semibold">•••</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm mb-1">Status</div>
                        <div className="text-green-600 font-semibold">● Active</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm mb-1">Type</div>
                        <div className="font-semibold">Virtual Card</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSACTIONS SECTION */}
              {walletSection === 'transactions' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Transactions</h1>

                  <div className="bg-white rounded-xl shadow-md p-16 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-500 text-lg">No transactions yet</p>
                    <p className="text-gray-400 text-sm mt-2">All licensing payments and withdrawals will appear here</p>
                  </div>
                </div>
              )}

              {/* DIRECT DEPOSIT SECTION */}
              {walletSection === 'deposit' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Direct Deposit</h1>

                  <div className="bg-white rounded-xl shadow-md p-16 text-center">
                    <div className="text-6xl mb-4">🏦</div>
                    <p className="text-gray-500 text-lg mb-6">No bank account connected</p>
                    <button className="bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-bold py-3 px-8 rounded-lg transition-all">
                      Connect Bank Account
                    </button>
                  </div>
                </div>
              )}

              {/* SETTINGS SECTION */}
              {walletSection === 'settings' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Wallet Settings</h1>

                  <div className="bg-white rounded-xl shadow-md divide-y">
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Payment Notifications</h3>
                      <p className="text-gray-500 text-sm">Get notified when you receive payments</p>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Auto-Withdraw</h3>
                      <p className="text-gray-500 text-sm">Automatically transfer earnings to your bank</p>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Spending Limits</h3>
                      <p className="text-gray-500 text-sm">Set daily or monthly spending limits</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MARKETPLACE PAGE */}
        {currentPage === 'marketplace' && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Marketplace</h1>
              <p className="text-gray-600">License your protected content and earn revenue</p>
            </div>

            {/* Marketplace Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                <div className="text-gray-500 text-sm mb-2">Listed Items</div>
                <div className="text-3xl font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-400 mt-1">Available for license</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <div className="text-gray-500 text-sm mb-2">Active Licenses</div>
                <div className="text-3xl font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-400 mt-1">Currently licensed</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                <div className="text-gray-500 text-sm mb-2">Pending Requests</div>
                <div className="text-3xl font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-400 mt-1">Awaiting approval</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <div className="text-gray-500 text-sm mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-gray-800">$0</div>
                <div className="text-xs text-gray-400 mt-1">Lifetime earnings</div>
              </div>
            </div>

            {/* List Content */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-2">List Your Protected Content</h2>
              <p className="text-white/90 mb-6">Set licensing terms and earn passive income from your creations</p>
              <button className="bg-white text-purple-600 font-bold py-3 px-8 rounded-lg hover:shadow-lg transition-all">
                Create Listing
              </button>
            </div>

            {/* License Types */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Available License Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-all">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-semibold text-gray-800 mb-1">Personal Use</div>
                  <div className="text-sm text-gray-500">Non-commercial projects</div>
                </div>
                <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-all">
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-semibold text-gray-800 mb-1">Commercial Use</div>
                  <div className="text-sm text-gray-500">Business & marketing</div>
                </div>
                <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-all">
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-semibold text-gray-800 mb-1">Exclusive Rights</div>
                  <div className="text-sm text-gray-500">Full ownership transfer</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTHER PAGES - Placeholder */}
        {['profile', 'settings'].includes(currentPage) && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 capitalize">{currentPage}</h1>
            <div className="bg-white rounded-xl shadow-md p-12 md:p-16 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Coming Soon</h3>
              <p className="text-gray-500">This section is under development</p>
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
