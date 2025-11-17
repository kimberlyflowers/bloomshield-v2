'use client';

import { useState, useRef, useEffect } from 'react';
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

  // Profile page state
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '',
    bio: 'Freelance photographer and digital artist based in San Francisco.',
    businessEnabled: false,
    businessName: '',
    companyWebsite: '',
    industry: '',
    taxId: '',
    portfolioWebsite: '',
    instagram: '@sarahjohnson',
    twitter: '',
    linkedin: '',
    other: '',
    accountType: 'free', // or 'pro'
    memberSince: 'March 2024',
    profilePhoto: '👤'
  });
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Protected files state (for My Files dashboard section)
  const [protectedFiles, setProtectedFiles] = useState<any[]>([]);

  // Settings page state
  const [settingsSection, setSettingsSection] = useState('account');
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [userWallet, setUserWallet] = useState<any>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  // Load protected files from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFiles = localStorage.getItem('protectedFiles');
      if (savedFiles) {
        try {
          const files = JSON.parse(savedFiles);
          setProtectedFiles(files);
        } catch (error) {
          console.error('Error loading protected files:', error);
        }
      }

      // Load wallet data
      const wallet = localStorage.getItem('userWallet');
      if (wallet) {
        setUserWallet(JSON.parse(wallet));
      }

      // Load 2FA status
      const twoFA = localStorage.getItem('twoFactorEnabled');
      if (twoFA === 'true') {
        setTwoFactorEnabled(true);
      }

      // Load API keys
      const keys = localStorage.getItem('apiKeys');
      if (keys) {
        setApiKeys(JSON.parse(keys));
      }
    }
  }, []);

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

  // PRESERVED: Upload handler with UI enhancements - accepts file directly
  const handleUploadWithFile = async (fileToUpload: File) => {
    if (!fileToUpload) return;

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
      const hashes = await generateHashes(fileToUpload);
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
            fileName: fileToUpload.name,
            fileSize: fileToUpload.size,
            mimeType: fileToUpload.type,
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

      const fileName = `${hashes.legal.slice(0, 16)}_${Date.now()}_${fileToUpload.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('protected-files')
        .upload(fileName, fileToUpload);

      if (uploadError && !uploadError.message.includes('already exists')) {
        throw uploadError;
      }

      // Step 4: Save to Database
      setUploadStatus('Saving protection record...');
      const { data: dbData, error: dbError } = await supabase
        .from('protected_files')
        .insert({
          file_name: fileToUpload.name,
          file_size: fileToUpload.size,
          mime_type: fileToUpload.type,
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

      // Get wallet info
      const walletData = typeof window !== 'undefined' ? localStorage.getItem('userWallet') : null;
      const wallet = walletData ? JSON.parse(walletData) : null;

      // Generate IPFS hash (simulated)
      const ipfsHash = 'Qm' + Array.from({length: 44}, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
      ).join('');

      // Prepare certificate data with actual file information + blockchain info
      const certData = {
        assetId: hashes.floral,
        fileName: fileToUpload.name,
        fileType: fileToUpload.type || 'Unknown',
        fileSize: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
        protectedDate: new Date().toISOString(),
        creator: 'User', // This would come from auth in production
        email: 'user@example.com', // This would come from auth in production
        legalHash: hashes.legal,
        contentHash: hashes.content,
        floralHash: hashes.floral,
        blockchainTx: blockchainTransactionHash,
        ownerWallet: wallet?.address || 'No wallet',
        ipfsHash: ipfsHash,
      };
      setCertificateData(certData);

      // Save to localStorage for My Files section
      if (typeof window !== 'undefined') {
        try {
          const savedFiles = localStorage.getItem('protectedFiles');
          const filesArray = savedFiles ? JSON.parse(savedFiles) : [];
          filesArray.unshift(certData); // Add new file to the beginning
          localStorage.setItem('protectedFiles', JSON.stringify(filesArray));
          setProtectedFiles(filesArray); // Update state
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }

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

  // Legacy upload handler for backward compatibility with button
  const handleUpload = async () => {
    if (!selectedFile) return;
    await handleUploadWithFile(selectedFile);
  };

  // Helper function to show toast
  const showToastMessage = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Helper function to get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (!fileType) return '📄';
    const type = fileType.toLowerCase();
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return '🖼️';
    if (type.includes('video') || type.includes('mp4') || type.includes('mov')) return '🎬';
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('illustrator') || type.includes('photoshop')) return '🎨';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📄';
  };

  // Helper function to get relative date (e.g., "Protected 2 days ago")
  const getRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    } catch (error) {
      return dateString;
    }
  };

  // Handle file selection - AUTO-START processing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      showToastMessage(`Selected: ${file.name}`, 'success');
      // Auto-start upload process
      await handleUploadWithFile(file);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      showToastMessage('⚠️ Please enter a Shield ID or creator name', 'warning');
      return;
    }

    // Search through certificate data
    if (certificateData) {
      const query = searchQuery.toLowerCase().trim();
      const assetIdMatch = certificateData.assetId.toLowerCase().includes(query);
      const fileNameMatch = certificateData.fileName.toLowerCase().includes(query);
      const creatorMatch = certificateData.creator.toLowerCase().includes(query);

      if (assetIdMatch || fileNameMatch || creatorMatch) {
        // Found a match - show the certificate
        setShowCertificate(true);
        showToastMessage(`✓ Found: ${certificateData.fileName}`, 'success');
        return;
      }
    }

    // No match found
    showToastMessage(`❌ No results found for: ${searchQuery}`, 'warning');
  };

  // Handle login button click - show modal
  const handleLogin = () => {
    setShowLoginModal(true);
  };

  // Generate user wallet on first login
  const generateUserWallet = () => {
    // Generate wallet address
    const address = '0x' + Array.from({length: 40}, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');

    // Generate 12-word seed phrase
    const wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz'];

    const seedPhrase = [];
    for (let i = 0; i < 12; i++) {
      seedPhrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
    }

    return {
      address: address,
      seedPhrase: seedPhrase.join(' ')
    };
  };

  // Handle actual login after method selection
  const handleLoginComplete = (method: 'google' | 'email' | 'facebook') => {
    setIsLoggedIn(true);

    const methodNames = {
      google: 'Google',
      email: 'Email',
      facebook: 'Facebook'
    };

    showToastMessage(`🔐 Logged in with ${methodNames[method]}! Welcome to BloomShield`, 'success');

    // Initialize wallet on first login
    if (typeof window !== 'undefined') {
      const existingWallet = localStorage.getItem('userWallet');
      const seedPhraseAck = localStorage.getItem('seedPhraseAcknowledged');

      if (!existingWallet) {
        const wallet = generateUserWallet();
        localStorage.setItem('userWallet', JSON.stringify(wallet));
        setUserWallet(wallet);

        // Show seed phrase modal only if not acknowledged before
        if (!seedPhraseAck) {
          setTimeout(() => setShowSeedPhraseModal(true), 1000);
        }
      }
    }
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

  // Handle wallet actions
  const handleAddMoney = () => {
    alert('💳 Add Money\n\nThis feature would integrate with Stripe or another payment processor to add funds to your BloomShield wallet.\n\nComing soon in production!');
  };

  const handleWithdraw = () => {
    alert('💸 Withdraw Funds\n\nThis feature would allow you to transfer your earnings to your connected bank account.\n\nPlease connect a bank account first under Direct Deposit.');
  };

  const handleConnectBank = () => {
    alert('🏦 Connect Bank Account\n\nThis feature would integrate with Plaid or Stripe to securely connect your bank account for direct deposits.\n\nComing soon in production!');
  };

  // Handle upgrade to pro
  const handleUpgradeToPro = () => {
    alert('✨ Upgrade to BloomShield Pro\n\nPro features include:\n• Advanced content monitoring across the web\n• Case management for infringement\n• Priority support\n• Unlimited file protection\n\nContact sales@bloomshield.com for pricing.');
  };

  // Handle create listing
  const handleCreateListing = () => {
    if (!certificateData) {
      alert('📄 Create Listing\n\nTo create a marketplace listing, first protect a file by uploading it on the home page.\n\nThen you can list it here for licensing!');
      return;
    }
    alert(`📄 Create Listing for ${certificateData.fileName}\n\nThis feature would allow you to:\n• Set licensing terms and pricing\n• Choose license types (personal/commercial/exclusive)\n• Publish to the BloomShield marketplace\n\nComing soon in production!`);
  };

  // Profile page handlers
  const handleProfileEdit = () => {
    if (profileEditMode) {
      // Save changes
      showToastMessage('✅ Profile updated successfully!', 'success');
      setProfileEditMode(false);
    } else {
      // Enter edit mode
      setProfileEditMode(true);
    }
  };

  const handleProfileCancel = () => {
    // Revert changes (in a real app, you'd restore from saved state)
    setProfileEditMode(false);
    showToastMessage('Changes cancelled', 'warning');
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileData(prev => ({ ...prev, profilePhoto: result }));
        showToastMessage('✅ Profile photo updated', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handlePasswordModalClose = () => {
    setShowChangePasswordModal(false);
  };

  const handlePasswordChange = () => {
    // In real app: validate and submit password change
    showToastMessage('✅ Password changed successfully!', 'success');
    setShowChangePasswordModal(false);
  };

  const handleAccountAction = (action: string) => {
    const messages: { [key: string]: string } = {
      '2fa': '🔐 Two-Factor Authentication\n\nThis feature will allow you to add an extra layer of security to your account.\n\nComing soon!',
      'notifications': '📧 Email Notifications\n\nManage your email notification preferences here.\n\nComing soon!',
      'privacy': '🔒 Privacy Settings\n\nControl who can see your work and contact you.\n\nComing soon!',
      'download': '📥 Download My Data\n\nRequest a copy of all your data stored with BloomShield.\n\nComing soon!',
      'delete': '⚠️ Delete Account\n\nPermanently delete your account and all associated data.\n\nPlease contact support@bloomshield.com if you wish to delete your account.'
    };
    alert(messages[action] || 'Feature coming soon!');
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
          onLogoClick={() => setCurrentPage('home')}
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
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-[#FF8C42]">
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
                    className="border-2 border-dashed border-gray-300 hover:border-[#FF8C42] rounded-lg p-8 mb-4 cursor-pointer transition-all hover:bg-orange-50 text-center"
                  >
                    <div className="text-5xl mb-3">📁</div>
                    <div className="text-gray-600 font-medium">
                      {selectedFile
                        ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                        : 'Click to choose files or drag & drop'
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-bold py-2.5 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    CHOOSE FILES
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
                      <div className="text-4xl font-bold text-gray-800">{protectedFiles.length}</div>
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
                  {protectedFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No files protected yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {protectedFiles.slice(0, 4).map((file, index) => (
                        <div
                          key={index}
                          className="file-card cursor-pointer"
                          onClick={() => {
                            setCertificateData(file);
                            setShowCertificate(true);
                          }}
                        >
                          <div className="w-full h-48 flex items-center justify-center text-6xl bg-[#E8E8E8]">
                            {getFileIcon(file.fileType)}
                          </div>
                          <div className="p-5">
                            <div className="font-semibold text-gray-800 mb-2 truncate" title={file.fileName}>
                              {file.fileName}
                            </div>
                            <div className="text-gray-500 text-sm mb-3">
                              Protected {getRelativeDate(file.protectedDate)}
                            </div>
                            <div className="font-mono bg-gray-100 p-3 rounded-lg text-xs text-gray-600 truncate" title={file.assetId}>
                              {file.assetId}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MY FILES SECTION */}
              {dashboardSection === 'files' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">My Files</h1>
                  <p className="text-gray-600 mb-8">All your protected files in one place</p>

                  {protectedFiles.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📁</div>
                      <p className="text-gray-500 text-lg mb-2">No protected files yet</p>
                      <p className="text-gray-400">Upload a file to get started with BloomShield protection</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {protectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="file-card cursor-pointer"
                          onClick={() => {
                            setCertificateData(file);
                            setShowCertificate(true);
                          }}
                        >
                          <div className="w-full h-48 flex items-center justify-center text-6xl bg-[#E8E8E8]">
                            {getFileIcon(file.fileType)}
                          </div>
                          <div className="p-5">
                            <div className="font-semibold text-gray-800 mb-2 truncate" title={file.fileName}>
                              {file.fileName}
                            </div>
                            <div className="text-gray-500 text-sm mb-3">
                              Protected {getRelativeDate(file.protectedDate)}
                            </div>
                            <div className="font-mono bg-gray-100 p-3 rounded-lg text-xs text-gray-600 truncate" title={file.assetId}>
                              {file.assetId}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MONITORING SECTION */}
              {dashboardSection === 'monitoring' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Monitoring</h1>

                  <div className="bg-[#FFB8A3] rounded-2xl p-12 text-center text-white shadow-lg">
                    <h3 className="text-3xl font-bold mb-4">🔍 Unlock Advanced Monitoring</h3>
                    <p className="text-xl mb-8 opacity-95">Track your content across the web and get alerts when copies are detected</p>
                    <button
                      onClick={handleUpgradeToPro}
                      className="bg-white text-[#FF8C42] font-bold py-4 px-10 rounded-lg hover:shadow-xl transition-all text-lg"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {/* CASES SECTION */}
              {dashboardSection === 'cases' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Cases</h1>

                  <div className="bg-[#FFB8A3] rounded-2xl p-12 text-center text-white shadow-lg">
                    <h3 className="text-3xl font-bold mb-4">⚖️ Unlock Case Management</h3>
                    <p className="text-xl mb-8 opacity-95">Manage infringement cases and work with legal partners to protect your rights</p>
                    <button
                      onClick={handleUpgradeToPro}
                      className="bg-white text-[#FF8C42] font-bold py-4 px-10 rounded-lg hover:shadow-xl transition-all text-lg"
                    >
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
                    <button
                      onClick={handleAddMoney}
                      className="bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-semibold py-4 px-6 rounded-lg transition-all"
                    >
                      + Add Money
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="bg-white border-2 border-[#FF8C42] text-[#FF8C42] hover:bg-orange-50 font-semibold py-4 px-6 rounded-lg transition-all"
                    >
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
                    <button
                      onClick={handleConnectBank}
                      className="bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-bold py-3 px-8 rounded-lg transition-all"
                    >
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
            <div className="bg-[#FFB8A3] rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-2">List Your Protected Content</h2>
              <p className="text-white/90 mb-6">Set licensing terms and earn passive income from your creations</p>
              <button
                onClick={handleCreateListing}
                className="bg-white text-[#FF8C42] font-bold py-3 px-8 rounded-lg hover:shadow-lg transition-all"
              >
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

        {/* PROFILE PAGE */}
        {currentPage === 'profile' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6 text-center">
              <input
                type="file"
                ref={profilePhotoInputRef}
                onChange={handleProfilePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => profilePhotoInputRef.current?.click()}
                className="w-32 h-32 mx-auto mb-4 rounded-full bg-[#E8E8E8] flex items-center justify-center text-6xl cursor-pointer hover:opacity-80 transition-all overflow-hidden"
                style={{
                  backgroundImage: profileData.profilePhoto.startsWith('data:') ? `url(${profileData.profilePhoto})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!profileData.profilePhoto.startsWith('data:') && profileData.profilePhoto}
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{profileData.fullName}</h1>
              <div className="inline-block bg-orange-100 text-[#FF8C42] px-4 py-1 rounded-full font-semibold text-sm mb-2">
                {profileData.accountType === 'pro' ? '🌟 Pro Account' : '🆓 Free Account'}
              </div>
              <p className="text-gray-500 text-sm">Member since: {profileData.memberSince}</p>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                <div className="flex gap-2">
                  {profileEditMode && (
                    <button
                      onClick={handleProfileCancel}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleProfileEdit}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      profileEditMode
                        ? 'bg-[#FF8C42] text-white hover:bg-[#ff7a2e]'
                        : 'border-2 border-[#FF8C42] text-[#FF8C42] hover:bg-orange-50'
                    }`}
                  >
                    {profileEditMode ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!profileEditMode}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!profileEditMode}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!profileEditMode}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.businessEnabled}
                    onChange={(e) => setProfileData(prev => ({ ...prev, businessEnabled: e.target.checked }))}
                    disabled={!profileEditMode}
                    className="w-5 h-5 text-[#FF8C42] rounded focus:ring-[#FF8C42] disabled:opacity-50"
                  />
                  <span className="ml-2 text-lg font-semibold text-gray-800">I'm using BloomShield for business</span>
                </label>
              </div>
              {profileData.businessEnabled && (
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={profileData.businessName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                      disabled={!profileEditMode}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Company Website</label>
                    <input
                      type="url"
                      value={profileData.companyWebsite}
                      onChange={(e) => setProfileData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                      disabled={!profileEditMode}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Industry</label>
                    <select
                      value={profileData.industry}
                      onChange={(e) => setProfileData(prev => ({ ...prev, industry: e.target.value }))}
                      disabled={!profileEditMode}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    >
                      <option value="">Select industry...</option>
                      <option value="photography">Photography</option>
                      <option value="design">Design</option>
                      <option value="music">Music</option>
                      <option value="video">Video</option>
                      <option value="writing">Writing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Tax ID/EIN (optional)</label>
                    <input
                      type="text"
                      value={profileData.taxId}
                      onChange={(e) => setProfileData(prev => ({ ...prev, taxId: e.target.value }))}
                      disabled={!profileEditMode}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Social Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Portfolio/Website</label>
                  <input
                    type="url"
                    value={profileData.portfolioWebsite}
                    onChange={(e) => setProfileData(prev => ({ ...prev, portfolioWebsite: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={profileData.instagram}
                    onChange={(e) => setProfileData(prev => ({ ...prev, instagram: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="@username"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Twitter/X</label>
                  <input
                    type="text"
                    value={profileData.twitter}
                    onChange={(e) => setProfileData(prev => ({ ...prev, twitter: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="@username"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="linkedin.com/in/username"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Other</label>
                  <input
                    type="text"
                    value={profileData.other}
                    onChange={(e) => setProfileData(prev => ({ ...prev, other: e.target.value }))}
                    disabled={!profileEditMode}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
              <div className="space-y-2">
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-gray-700 group-hover:text-[#FF8C42]">→ Change Password</span>
                </button>
                <button
                  onClick={() => handleAccountAction('2fa')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-gray-700 group-hover:text-[#FF8C42]">→ Two-Factor Authentication</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                </button>
                <button
                  onClick={() => handleAccountAction('notifications')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-gray-700 group-hover:text-[#FF8C42]">→ Email Notifications</span>
                </button>
                <button
                  onClick={() => handleAccountAction('privacy')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-gray-700 group-hover:text-[#FF8C42]">→ Privacy Settings</span>
                </button>
                <button
                  onClick={() => handleAccountAction('download')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-gray-700 group-hover:text-[#FF8C42]">→ Download My Data</span>
                </button>
                <button
                  onClick={() => handleAccountAction('delete')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-red-600 group-hover:text-red-700">→ Delete Account</span>
                </button>
              </div>
            </div>

            {/* Subscription/Account Tier */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Subscription</h2>
              {profileData.accountType === 'free' ? (
                <>
                  <div className="mb-6">
                    <div className="text-lg font-semibold text-gray-800 mb-4">Current Plan: Free</div>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span> Unlimited file protection
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span> Certificate generation
                      </div>
                      <div className="flex items-center text-gray-400">
                        <span className="text-gray-300 mr-2">✗</span> Advanced monitoring
                      </div>
                      <div className="flex items-center text-gray-400">
                        <span className="text-gray-300 mr-2">✗</span> Case management
                      </div>
                      <div className="flex items-center text-gray-400">
                        <span className="text-gray-300 mr-2">✗</span> Priority support
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgradeToPro}
                    className="w-full bg-[#FF8C42] hover:bg-[#ff7a2e] text-white font-bold py-3 px-6 rounded-lg transition-all hover:shadow-lg"
                  >
                    Upgrade to Pro →
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="text-lg font-semibold text-gray-800 mb-2">Current Plan: Pro</div>
                    <div className="text-gray-600 mb-1">Billing: $29/month</div>
                    <div className="text-gray-600">Next billing date: Dec 15, 2025</div>
                  </div>
                  <div className="flex gap-4">
                    <button className="flex-1 bg-white border-2 border-[#FF8C42] text-[#FF8C42] hover:bg-orange-50 font-semibold py-3 px-6 rounded-lg transition-all">
                      Manage Subscription
                    </button>
                    <button className="flex-1 bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-all">
                      View Invoices
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS PAGE */}
        {currentPage === 'settings' && (
          <div className="flex h-[calc(100vh-70px)] bg-gray-50">
            {/* Settings Submenu */}
            <div className="w-60 bg-white border-r border-gray-200 p-8 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setSettingsSection('account')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'account'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Account
                </button>
                <button
                  onClick={() => setSettingsSection('wallet')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'wallet'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Ownership Wallet
                </button>
                <button
                  onClick={() => setSettingsSection('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'security'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setSettingsSection('privacy')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'privacy'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Privacy
                </button>
              </nav>
            </div>

            {/* Settings Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* ACCOUNT SECTION */}
              {settingsSection === 'account' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Account Settings</h1>
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h3>
                    <p className="text-gray-600">Manage your account details and preferences.</p>
                    <button
                      onClick={() => setCurrentPage('profile')}
                      className="mt-4 bg-[#FF8C42] text-white px-6 py-2 rounded-lg hover:bg-[#ff7a2e] transition-all"
                    >
                      Go to Profile →
                    </button>
                  </div>
                </div>
              )}

              {/* OWNERSHIP WALLET SECTION */}
              {settingsSection === 'wallet' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">Ownership Wallet</h1>
                  <p className="text-gray-600 mb-8">Your permanent proof of ownership on the blockchain</p>

                  {/* Wallet Address Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Wallet Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <code className="text-sm font-mono text-gray-800 break-all">
                        {userWallet?.address || 'No wallet generated yet'}
                      </code>
                    </div>
                    {userWallet && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(userWallet.address);
                          showToastMessage('📋 Wallet address copied!', 'success');
                        }}
                        className="bg-[#FF8C42] text-white px-6 py-2 rounded-lg hover:bg-[#ff7a2e] transition-all"
                      >
                        📋 Copy Address
                      </button>
                    )}
                  </div>

                  {/* Recovery Phrase Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Recovery Phrase</h3>
                    <div className="bg-[#FFF5F0] border-2 border-[#FF8C42] p-4 rounded-lg mb-4">
                      <p className="text-[#FF8C42] font-semibold mb-2">⚠️ CRITICAL: Keep This Safe</p>
                      <p className="text-gray-700 text-sm">
                        Your 12-word recovery phrase is the ONLY way to prove ownership if BloomShield shuts down.
                        Never share it with anyone.
                      </p>
                    </div>
                    {userWallet && (
                      <button
                        onClick={() => {
                          const confirmed = confirm(
                            '⚠️ WARNING: Never share your recovery phrase with anyone!\n\n' +
                            'Anyone with this phrase can claim ownership of all your protected work.\n\n' +
                            'Click OK to view your recovery phrase.'
                          );
                          if (confirmed) {
                            alert(`Your Recovery Phrase:\n\n${userWallet.seedPhrase}\n\nStore this safely offline!`);
                          }
                        }}
                        className="bg-white border-2 border-[#FF8C42] text-[#FF8C42] px-6 py-2 rounded-lg hover:bg-orange-50 transition-all"
                      >
                        🔑 View Recovery Phrase
                      </button>
                    )}
                  </div>

                  {/* Protected Assets Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Protected Assets</h3>
                    {protectedFiles.length === 0 ? (
                      <p className="text-gray-500">No protected assets yet</p>
                    ) : (
                      <div className="space-y-3">
                        {protectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{file.fileName}</p>
                              <p className="text-gray-500 text-sm font-mono">{file.assetId}</p>
                            </div>
                            <span className="text-green-600 text-sm font-semibold">● Protected</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blockchain Info */}
                  <div className="bg-[#E8F5E9] border-l-4 border-green-500 p-6 rounded-lg mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">✓ Permanent Protection</h4>
                    <p className="text-gray-700 text-sm">
                      Your ownership records exist on the blockchain forever, completely independent of BloomShield.
                      Even if our service disappears, your proof of ownership remains permanent and verifiable.
                    </p>
                  </div>
                </div>
              )}

              {/* SECURITY SECTION - Placeholder */}
              {settingsSection === 'security' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Security</h1>
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Security Settings</h3>
                    <p className="text-gray-500">2FA, password management, and session control coming soon</p>
                  </div>
                </div>
              )}

              {/* PRIVACY SECTION - Placeholder */}
              {settingsSection === 'privacy' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Privacy</h1>
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">🔐</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Privacy Settings</h3>
                    <p className="text-gray-500">Privacy controls and data management coming soon</p>
                  </div>
                </div>
              )}
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] animate-fadeIn"
          onClick={handlePasswordModalClose}
        >
          <div
            className="bg-white w-[90%] max-w-md rounded-2xl p-8 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePasswordModalClose}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2 bg-[#FF8C42] text-white rounded-lg hover:bg-[#ff7a2e] transition-all font-semibold"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Phrase Modal - Shows on first login */}
      {showSeedPhraseModal && userWallet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔑</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Ownership Wallet Created</h2>
              <p className="text-gray-600">This is your permanent proof of ownership</p>
            </div>

            <div className="bg-[#FFF5F0] border-2 border-[#FF8C42] p-4 rounded-lg mb-6">
              <p className="text-[#FF8C42] font-semibold mb-2">⚠️ CRITICAL: Save This Recovery Phrase</p>
              <p className="text-gray-700 text-sm">
                This is the ONLY way to prove ownership if BloomShield ever shuts down. We cannot recover it for you.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <p className="text-gray-500 text-sm mb-4">Your 12-word recovery phrase:</p>
              <div className="bg-white p-4 rounded-lg mb-4">
                <code className="font-mono text-base text-gray-800 break-words leading-loose">
                  {userWallet.seedPhrase}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userWallet.seedPhrase);
                  showToastMessage('📋 Recovery phrase copied!', 'success');
                }}
                className="w-full bg-white border-2 border-[#FF8C42] text-[#FF8C42] py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all"
              >
                📋 Copy to Clipboard
              </button>
            </div>

            <div className="bg-[#E8F5E9] border-l-4 border-green-500 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-800 mb-2">✓ Why This Matters:</p>
              <p className="text-gray-700 text-sm">
                Even if BloomShield disappears, your blockchain records remain forever. This phrase is your key to prove
                ownership of all your protected work.
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 mr-3 cursor-pointer accent-[#FF8C42]"
                  onChange={(e) => {
                    const btn = document.getElementById('confirmSeedBtn') as HTMLButtonElement;
                    if (btn) {
                      btn.disabled = !e.target.checked;
                      btn.className = e.target.checked
                        ? 'w-full bg-[#FF8C42] text-white py-4 rounded-lg font-bold text-lg cursor-pointer hover:bg-[#ff7a2e] transition-all'
                        : 'w-full bg-gray-300 text-white py-4 rounded-lg font-bold text-lg cursor-not-allowed';
                    }
                  }}
                />
                <span className="text-gray-700">I have written down my recovery phrase in a safe place</span>
              </label>
            </div>

            <button
              id="confirmSeedBtn"
              disabled
              onClick={() => {
                localStorage.setItem('seedPhraseAcknowledged', 'true');
                setShowSeedPhraseModal(false);
                showToastMessage('✅ Wallet created! Your ownership is now permanent.', 'success');
              }}
              className="w-full bg-gray-300 text-white py-4 rounded-lg font-bold text-lg cursor-not-allowed"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

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
