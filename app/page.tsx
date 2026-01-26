'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Toast from '@/components/Toast';
import CertificateModal from '@/components/CertificateModal';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import AuthModal from '@/components/AuthModal';
import { onAuthStateChange, logout, generateUserWallet } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';

export default function Home() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Page navigation state
  const [currentPage, setCurrentPage] = useState('home');
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
  const [seedPhraseAcknowledged, setSeedPhraseAcknowledged] = useState(false);
  const [userWallet, setUserWallet] = useState<any>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  // Marketplace state
  const [marketplaceAssets, setMarketplaceAssets] = useState<any[]>([]);
  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');
  const [marketplaceFilters, setMarketplaceFilters] = useState({
    type: 'all',
    license: 'all',
    price: 'all',
    sort: 'newest'
  });
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [assetToList, setAssetToList] = useState<any>(null);

  // Load protected files and marketplace assets from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFiles = localStorage.getItem('protectedFiles');
      if (savedFiles) {
        try {
          const files = JSON.parse(savedFiles);
          setProtectedFiles(files);
          // Marketplace listings are now loaded from database via API
        } catch (error) {
          console.error('Error loading protected files:', error);
        }
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

  // Auth state listener
  useEffect(() => {
    const subscription = onAuthStateChange((user) => {
      setCurrentUser(user);
      setIsLoggedIn(!!user);
      setAuthLoading(false);

      if (user) {
        // Load user's wallet from their profile
        setUserWallet({
          address: user.walletAddress,
          seedPhrase: user.walletSeedPhrase
        });

        // Update profile data from user
        setProfileData({
          fullName: user.name,
          email: user.email,
          phone: user.phone || '',
          bio: user.bio || '',
          businessEnabled: !!user.businessName,
          businessName: user.businessName || '',
          companyWebsite: user.businessWebsite || '',
          industry: user.industry || '',
          taxId: '',
          portfolioWebsite: user.socialLinks?.website || '',
          instagram: user.socialLinks?.instagram || '',
          twitter: user.socialLinks?.twitter || '',
          linkedin: '',
          other: '',
          accountType: user.accountType,
          memberSince: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          profilePhoto: user.profilePhoto || '👤'
        });

        // Load 2FA status from user profile
        setTwoFactorEnabled(user.twoFactorEnabled);

        // Load user's protected files from database
        console.log('🔄 [Auth Change] User authenticated, loading protected files...');
        loadProtectedFilesFromDB();
      } else {
        setUserWallet(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load marketplace listings when user navigates to marketplace
  useEffect(() => {
    if (currentPage === 'marketplace') {
      loadMarketplaceListings();
    }
  }, [currentPage]);

  // PRESERVED: Hash generation function
  // Generate perceptual hash for images (resistant to minor edits)
  const generatePerceptualHash = async (file: File): Promise<string> => {
    // Only generate perceptual hash for images
    if (!file.type.startsWith('image/')) {
      // For non-images, use a robust content-based hash
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0xC' + hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          // Resize to 8x8 for perceptual hash (standard blockhash size)
          const size = 8;
          canvas.width = size;
          canvas.height = size;

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Draw image scaled down
          ctx.drawImage(img, 0, 0, size, size);

          // Get grayscale pixel data
          const imageData = ctx.getImageData(0, 0, size, size);
          const pixels = imageData.data;

          // Convert to grayscale and calculate average
          const grayscale: number[] = [];
          for (let i = 0; i < pixels.length; i += 4) {
            const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            grayscale.push(gray);
          }

          const average = grayscale.reduce((a, b) => a + b, 0) / grayscale.length;

          // Create hash: 1 if pixel > average, 0 otherwise
          let hash = '';
          for (let i = 0; i < grayscale.length; i++) {
            hash += grayscale[i] > average ? '1' : '0';
          }

          // Convert binary string to hex (perceptual hash)
          const hexHash = BigInt('0b' + hash).toString(16).padStart(16, '0');
          resolve('0xP' + hexHash);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for perceptual hashing'));
      img.src = URL.createObjectURL(file);
    });
  };

  const generateHashes = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Legal Hash (SHA-256) - Binary fingerprint of exact file
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const legal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Content Hash (Perceptual) - Detects similar images even with minor edits
      // For images: Uses 8x8 grayscale hash (like blockhash)
      // For non-images: Uses truncated SHA-256 for content verification
      const content = await generatePerceptualHash(file);

      // Floral Hash (Asset ID) - Human-readable deterministic identifier
      const floral = '🌸 BS-' + legal.substring(0, 4) + '-' + legal.substring(4, 8) + '-' + legal.substring(8, 12);

      console.log('✅ Generated hashes:', {
        legal: legal.substring(0, 16) + '...',
        content: content,
        floral: floral,
        fileType: file.type
      });

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
      // Use singleton Supabase client (imported at top)
      if (!supabase) {
        throw new Error('Supabase client not initialized');
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

      // Step 3: Pin to IPFS via Pinata
      setUploadStatus('Pinning to IPFS network...');
      setProcessingStep(4);

      let ipfsCid: string | null = null;
      let ipfsUrl: string | null = null;

      try {
        const ipfsFormData = new FormData();
        ipfsFormData.append('file', fileToUpload);
        ipfsFormData.append('fileName', fileToUpload.name);
        ipfsFormData.append('floralHash', hashes.floral);

        const ipfsResponse = await fetch('/api/ipfs/upload', {
          method: 'POST',
          body: ipfsFormData
        });

        const ipfsResult = await ipfsResponse.json();

        if (ipfsResult.success) {
          ipfsCid = ipfsResult.ipfsCid;
          ipfsUrl = ipfsResult.ipfsUrl;
          console.log(`✅ File pinned to IPFS: ${ipfsCid}`);
        } else {
          console.warn('⚠️ IPFS upload skipped:', ipfsResult.error);
        }
      } catch (ipfsError) {
        console.warn('⚠️ IPFS upload failed (non-critical):', ipfsError);
        // Continue without IPFS - it's not critical for protection
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Upload to Supabase Storage
      setUploadStatus('Uploading to secure storage...');
      setProcessingStep(5);

      const fileName = `${hashes.legal.slice(0, 16)}_${Date.now()}_${fileToUpload.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('protected-files')
        .upload(fileName, fileToUpload);

      if (uploadError && !uploadError.message.includes('already exists')) {
        throw uploadError;
      }

      // Step 5: Save to Database
      setUploadStatus('Saving protection record...');

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: dbData, error: dbError} = await supabase
        .from('protected_files')
        .insert({
          user_id: user.id,
          file_name: fileToUpload.name,
          file_size: fileToUpload.size,
          mime_type: fileToUpload.type,
          storage_path: uploadData?.path || fileName,
          legal_hash: hashes.legal,
          content_hash: hashes.content,
          floral_hash: hashes.floral,
          blockchain_tx: blockchainTransactionHash,
          blockchain_timestamp: blockchainTimestamp,
          ipfs_hash: ipfsCid, // ✅ Real IPFS CID from Pinata
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message || 'Failed to save protection record'}`);
      }

      setRecordId(dbData.id);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep(5);

      // Get wallet info
      const walletData = typeof window !== 'undefined' ? localStorage.getItem('userWallet') : null;
      const wallet = walletData ? JSON.parse(walletData) : null;

      // Prepare certificate data with actual file information + blockchain info + IPFS
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
        ipfsHash: ipfsCid || null, // ✅ Real IPFS CID from Pinata
        ipfsUrl: ipfsUrl || null,  // ✅ Public gateway URL for verification
      };
      setCertificateData(certData);

      // Reload protected files from database
      console.log('🔄 [File Upload] File uploaded, reloading protected files...');
      await loadProtectedFilesFromDB();

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

  // Handle login button click - show auth modal
  const handleLogin = () => {
    setShowLoginModal(true);
  };

  // Handle successful login
  const handleLoginSuccess = (user: UserProfile) => {
    // Update app state with logged in user
    setCurrentUser(user);
    setIsLoggedIn(true);

    // Set wallet from user profile
    if (user.walletAddress) {
      setUserWallet({
        address: user.walletAddress,
        seedPhrase: user.walletSeedPhrase || ''
      });
    }

    showToastMessage(`🔐 Welcome back, ${user.name}!`, 'success');
    setCurrentPage('dashboard');

    // Check if user needs to see seed phrase modal
    if (typeof window !== 'undefined') {
      const seedPhraseAck = localStorage.getItem('seedPhraseAcknowledged');
      if (!seedPhraseAck) {
        setTimeout(() => setShowSeedPhraseModal(true), 1000);
      }
    }
  };

  // Handle successful signup
  const handleSignUpSuccess = (userId: string) => {
    // Success message is shown in modal
    // User will need to verify email before logging in
  };

  // Handle logout
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setUserWallet(null);
      setCurrentPage('home');
      showToastMessage('✅ Logged out successfully', 'success');
    } else {
      showToastMessage('❌ Error logging out', 'error');
    }
  };

  // Marketplace Functions

  // Open listing modal for an asset
  const handleListAsset = (asset: any) => {
    setAssetToList(asset);
    setShowListingModal(true);
  };

  // List asset on marketplace
  const handleConfirmListing = async (listingData: any) => {
    if (!assetToList) return;

    try {
      // Call API to list asset in database
      const response = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floralId: assetToList.assetId,
          fileName: assetToList.fileName,
          fileType: assetToList.fileType,
          fileSize: assetToList.fileSize,
          creatorName: assetToList.creator || currentUser?.name || 'Unknown',
          creatorWallet: assetToList.creatorWallet || userWallet?.address || '0x0000000000000000000000000000000000000000',
          legalHash: assetToList.legalHash,
          ipfsHash: assetToList.ipfsHash,
          blockchainTx: assetToList.blockchainTx,
          blockNumber: assetToList.blockNumber,
          salePrice: listingData.salePrice,
          allowLease: listingData.allowLease,
          leasePrice1Month: listingData.leasePrice1Month,
          leasePrice6Month: listingData.leasePrice6Month,
          leasePrice1Year: listingData.leasePrice1Year,
          commercialUse: listingData.commercialUse,
          attribution: listingData.attribution,
          description: listingData.description || null
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to list asset');
      }

      // Update the asset with listing information locally
      const updatedAsset = {
        ...assetToList,
        isListed: true,
        salePrice: listingData.salePrice,
        allowLease: listingData.allowLease,
        leasePrice1Month: listingData.leasePrice1Month,
        leasePrice6Month: listingData.leasePrice6Month,
        leasePrice1Year: listingData.leasePrice1Year,
        commercialUse: listingData.commercialUse,
        attribution: listingData.attribution,
        resale: listingData.resale || false,
        listedDate: new Date().toISOString()
      };

      // Update protected files
      const updatedFiles = protectedFiles.map(file =>
        file.assetId === assetToList.assetId ? updatedAsset : file
      );

      setProtectedFiles(updatedFiles);
      localStorage.setItem('protectedFiles', JSON.stringify(updatedFiles));

      // Refresh marketplace listings from database
      await loadMarketplaceListings();

      setShowListingModal(false);
      setAssetToList(null);

      showToastMessage('✅ Asset listed on marketplace!', 'success');
    } catch (error) {
      console.error('Error listing asset:', error);
      showToastMessage(`❌ Failed to list asset: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Unlist asset from marketplace
  const handleUnlistAsset = async (assetId: string) => {
    try {
      // Call API to unlist asset in database
      const response = await fetch(`/api/marketplace/list?floralId=${encodeURIComponent(assetId)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to unlist asset');
      }

      // Update local state
      const updatedFiles = protectedFiles.map(file =>
        file.assetId === assetId ? { ...file, isListed: false, salePrice: 0 } : file
      );

      setProtectedFiles(updatedFiles);
      localStorage.setItem('protectedFiles', JSON.stringify(updatedFiles));

      // Refresh marketplace listings from database
      await loadMarketplaceListings();

      showToastMessage('✅ Asset removed from marketplace', 'success');
    } catch (error) {
      console.error('Error unlisting asset:', error);
      showToastMessage(`❌ Failed to unlist asset: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // View asset details
  const handleViewAsset = (asset: any) => {
    setSelectedAsset(asset);
    setShowAssetDetail(true);
  };

  // Purchase asset
  const handlePurchaseAsset = async () => {
    if (!selectedAsset || !currentUser) {
      showToastMessage('⚠️ Please log in to purchase', 'warning');
      return;
    }

    if (selectedAsset.creator === currentUser.name) {
      showToastMessage('⚠️ You cannot buy your own asset', 'warning');
      return;
    }

    const confirmed = confirm(
      `Purchase ${selectedAsset.fileName} for $${selectedAsset.salePrice}?\n\nThis will redirect you to checkout.`
    );

    if (!confirmed) return;

    try {
      // Call Polar checkout API
      const response = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.assetId,
          assetName: selectedAsset.fileName,
          assetType: 'sale',
          amount: selectedAsset.salePrice,
          sellerId: selectedAsset.creatorUid || selectedAsset.creator,
          sellerWallet: selectedAsset.creatorWallet
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout');
      }

      // Redirect to checkout URL
      if (result.checkoutUrl) {
        if (result.simulated) {
          // For simulated checkout, handle locally
          showToastMessage('⚠️ Using simulated payment (Polar not configured)', 'warning');

          // Simulate purchase locally
          const purchaseTx = '0x' + Array.from({ length: 64 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
          ).join('');

          const updatedFiles = protectedFiles.map(file => {
            if (file.assetId === selectedAsset.assetId) {
              return {
                ...file,
                creator: currentUser.name,
                creatorWallet: userWallet?.address,
                isListed: false,
                previousOwner: file.creator,
                purchaseDate: new Date().toISOString(),
                purchasePrice: file.salePrice,
                purchaseTx: purchaseTx
              };
            }
            return file;
          });

          setProtectedFiles(updatedFiles);
          localStorage.setItem('protectedFiles', JSON.stringify(updatedFiles));

          await loadMarketplaceListings();

          setShowAssetDetail(false);
          setSelectedAsset(null);

          showToastMessage('✅ Purchase successful! (Simulated)', 'success');
        } else {
          // Redirect to real Polar checkout
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      showToastMessage(`❌ Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Lease asset
  const handleLeaseAsset = async (duration: string, price: number) => {
    if (!selectedAsset || !currentUser) {
      showToastMessage('⚠️ Please log in to lease', 'warning');
      return;
    }

    if (selectedAsset.creator === currentUser.name) {
      showToastMessage('⚠️ You cannot lease your own asset', 'warning');
      return;
    }

    const confirmed = confirm(
      `Lease ${selectedAsset.fileName} for ${duration} at $${price}?\n\nThis will redirect you to checkout.`
    );

    if (!confirmed) return;

    try {
      // Call Polar checkout API for lease
      const response = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.assetId,
          assetName: selectedAsset.fileName,
          assetType: 'lease',
          amount: price,
          sellerId: selectedAsset.creatorUid || selectedAsset.creator,
          sellerWallet: selectedAsset.creatorWallet,
          leaseDuration: duration
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout');
      }

      // Redirect to checkout URL
      if (result.checkoutUrl) {
        if (result.simulated) {
          // For simulated checkout, handle locally
          showToastMessage('⚠️ Using simulated payment (Polar not configured)', 'warning');

          // Simulate lease locally
          const leaseTx = '0x' + Array.from({ length: 64 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
          ).join('');

          const durationDays = duration === '1 Month' ? 30 : duration === '6 Months' ? 180 : 365;
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + durationDays);

          const leases = JSON.parse(localStorage.getItem('leases') || '[]');
          leases.push({
            assetId: selectedAsset.assetId,
            assetName: selectedAsset.fileName,
            lessee: currentUser.name,
            lesseeWallet: userWallet?.address,
            owner: selectedAsset.creator,
            ownerWallet: selectedAsset.creatorWallet,
            startDate: new Date().toISOString(),
            endDate: endDate.toISOString(),
            duration: duration,
            price: price,
            leaseTx: leaseTx,
            active: true
          });

          localStorage.setItem('leases', JSON.stringify(leases));

          setShowAssetDetail(false);
          setSelectedAsset(null);

          showToastMessage('✅ Lease created successfully! (Simulated)', 'success');
        } else {
          // Redirect to real Polar checkout
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (error) {
      console.error('Error creating lease checkout:', error);
      showToastMessage(`❌ Lease failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Load user's protected files from database
  const loadProtectedFilesFromDB = async () => {
    // Guard: Only fetch if user is logged in
    if (!isLoggedIn || !currentUser) {
      console.log('⚠️ Skipping file fetch - user not authenticated');
      console.log('  isLoggedIn:', isLoggedIn);
      console.log('  currentUser:', currentUser);
      return;
    }

    console.log('🔄 Fetching protected files from database...');
    console.log('  User:', currentUser?.email || 'Unknown');

    try {
      const response = await fetch('/api/files/protected');
      console.log('📡 API Response status:', response.status, response.statusText);

      const result = await response.json();
      console.log('📦 API Response data:', result);
      console.log('  success:', result.success);
      console.log('  count:', result.count);
      console.log('  files array length:', result.files?.length);

      if (result.success) {
        const filesArray = result.files || [];
        console.log(`✅ Setting ${filesArray.length} files to state`);
        setProtectedFiles(filesArray);
        // Also update localStorage for backward compatibility
        localStorage.setItem('protectedFiles', JSON.stringify(filesArray));
        console.log(`✅ SUCCESS: Loaded ${result.count} protected files from database`);
      } else {
        console.error('❌ API returned success: false');
        throw new Error(result.error || 'Failed to load protected files');
      }
    } catch (error) {
      console.error('❌ Error loading protected files:', error);
      // Fallback to localStorage if API fails
      const savedFiles = localStorage.getItem('protectedFiles');
      if (savedFiles) {
        try {
          const files = JSON.parse(savedFiles);
          console.log(`⚠️ Fallback: Loading ${files.length} files from localStorage`);
          setProtectedFiles(files);
        } catch (e) {
          console.error('Error parsing localStorage files:', e);
        }
      } else {
        console.log('⚠️ No localStorage fallback available');
      }
    }
  };

  // Load marketplace listings from database
  const loadMarketplaceListings = async () => {
    try {
      const params = new URLSearchParams();

      if (marketplaceSearchQuery) {
        params.append('search', marketplaceSearchQuery);
      }

      if (marketplaceFilters.type !== 'all') {
        params.append('assetType', marketplaceFilters.type);
      }

      if (marketplaceFilters.license !== 'all') {
        params.append('licenseType', marketplaceFilters.license);
      }

      // Parse price filter (e.g., "0-100", "100-500", "1000+")
      if (marketplaceFilters.price !== 'all') {
        const priceRange = marketplaceFilters.price;
        if (priceRange.includes('+')) {
          const minPrice = parseInt(priceRange.replace('+', ''));
          params.append('minPrice', minPrice.toString());
        } else if (priceRange.includes('-')) {
          const [min, max] = priceRange.split('-').map(Number);
          if (min) params.append('minPrice', min.toString());
          if (max) params.append('maxPrice', max.toString());
        }
      }

      params.append('sortBy', marketplaceFilters.sort);

      const response = await fetch(`/api/marketplace/listings?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setMarketplaceAssets(result.listings || []);
      } else {
        throw new Error(result.error || 'Failed to load listings');
      }
    } catch (error) {
      console.error('Error loading marketplace listings:', error);
      showToastMessage(`❌ Failed to load marketplace: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Search marketplace
  const handleMarketplaceSearch = () => {
    loadMarketplaceListings();
  };

  // Apply marketplace filters
  const handleApplyFilters = () => {
    // Filters are now handled by the API in loadMarketplaceListings
    loadMarketplaceListings();
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
    setCertificateData(null); // Clear data to prevent reopening
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
    const sectionMap: { [key: string]: string } = {
      '2fa': 'security',
      'notifications': 'notifications',
      'privacy': 'privacy',
      'download': 'data',
      'delete': 'advanced'
    };

    const section = sectionMap[action];
    if (section) {
      setSettingsSection(section);
      setCurrentPage('settings');
      showToastMessage(`Navigating to ${action === '2fa' ? 'Security Settings' : action.charAt(0).toUpperCase() + action.slice(1)}...`, 'success');
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
                        <div key={index} className="file-card">
                          <div
                            className="cursor-pointer"
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

                          {/* Action Buttons */}
                          <div className="px-5 pb-5 space-y-2">
                            {file.isListed ? (
                              <div className="space-y-2">
                                <div className="bg-green-50 border border-green-200 text-green-700 text-center py-2 rounded-lg text-sm font-semibold">
                                  ✓ Listed on Marketplace
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlistAsset(file.assetId);
                                  }}
                                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all"
                                >
                                  Remove from Marketplace
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleListAsset(file);
                                }}
                                className="w-full bg-[#FF8C42] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#ff7a2e] transition-all"
                              >
                                🛒 List on Marketplace
                              </button>
                            )}
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

        {/* MARKETPLACE PAGE */}
        {currentPage === 'marketplace' && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Marketplace Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Marketplace</h1>
              <p className="text-gray-600">Buy or lease creative assets protected on blockchain</p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={marketplaceSearchQuery}
                  onChange={(e) => setMarketplaceSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleMarketplaceSearch()}
                  placeholder="Search assets by name, creator, or Asset ID..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                />
                <button
                  onClick={handleMarketplaceSearch}
                  className="bg-[#FF8C42] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#ff7a2e] transition-all"
                >
                  🔍 Search
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Asset Type</label>
                  <select
                    value={marketplaceFilters.type}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">Documents</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Type</label>
                  <select
                    value={marketplaceFilters.license}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, license: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  >
                    <option value="all">All</option>
                    <option value="sale">For Sale</option>
                    <option value="lease">For Lease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                  <select
                    value={marketplaceFilters.price}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  >
                    <option value="all">Any Price</option>
                    <option value="0-50">$0 - $50</option>
                    <option value="50-200">$50 - $200</option>
                    <option value="200-1000">$200 - $1000</option>
                    <option value="1000+">$1000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                  <select
                    value={marketplaceFilters.sort}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, sort: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleApplyFilters}
                className="mt-4 bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                Apply Filters
              </button>
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceAssets.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl shadow-md p-16 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 text-lg mb-2">No assets listed yet</p>
                  <p className="text-gray-400 text-sm">Check back later for new listings!</p>
                </div>
              ) : (
                marketplaceAssets.map((asset, index) => (
                  <div
                    key={index}
                    onClick={() => handleViewAsset(asset)}
                    className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    {/* Asset Thumbnail */}
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      <div className="text-6xl">{getFileIcon(asset.fileType)}</div>
                    </div>

                    {/* Asset Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-2 truncate">{asset.fileName}</h3>
                      <p className="text-sm text-gray-500 mb-3">by {asset.creator}</p>

                      <div className="flex items-center justify-between mb-3">
                        {asset.salePrice > 0 && (
                          <div className="text-2xl font-bold text-[#FF8C42]">${asset.salePrice}</div>
                        )}
                        {asset.allowLease && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-semibold">
                            Lease Available
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{asset.fileType}</span>
                        <span>{getRelativeDate(asset.protectedDate)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                <button
                  onClick={() => setSettingsSection('notifications')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'notifications'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setSettingsSection('billing')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'billing'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Billing
                </button>
                <button
                  onClick={() => setSettingsSection('data')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'data'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Data & Export
                </button>
                <button
                  onClick={() => setSettingsSection('advanced')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    settingsSection === 'advanced'
                      ? 'bg-orange-50 text-[#FF8C42] border-l-4 border-[#FF8C42] font-semibold'
                      : 'text-gray-600 border-transparent hover:bg-gray-50'
                  }`}
                >
                  Advanced
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

              {/* SECURITY SECTION */}
              {settingsSection === 'security' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">Security</h1>
                  <p className="text-gray-600 mb-8">Manage your account security and authentication</p>

                  {/* Password Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Password</h3>
                    <p className="text-gray-600 mb-4">Update your password regularly to keep your account secure</p>
                    <button
                      onClick={() => {
                        const newPassword = prompt('Enter new password (minimum 8 characters):');
                        if (newPassword && newPassword.length >= 8) {
                          localStorage.setItem('userPassword', newPassword);
                          showToastMessage('✅ Password updated successfully!', 'success');
                        } else if (newPassword) {
                          showToastMessage('⚠️ Password must be at least 8 characters', 'warning');
                        }
                      }}
                      className="bg-[#FF8C42] text-white px-6 py-2 rounded-lg hover:bg-[#ff7a2e] transition-all"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* 2FA Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Two-Factor Authentication</h3>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-gray-800 font-semibold">
                          Status: {twoFactorEnabled ? (
                            <span className="text-green-600">✓ Enabled</span>
                          ) : (
                            <span className="text-gray-500">Not enabled</span>
                          )}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      {twoFactorEnabled ? (
                        <button
                          onClick={() => {
                            const confirmed = confirm('Are you sure you want to disable 2FA?');
                            if (confirmed) {
                              setTwoFactorEnabled(false);
                              setShow2FASetup(false);
                              localStorage.setItem('twoFactorEnabled', 'false');
                              showToastMessage('🔓 Two-factor authentication disabled', 'success');
                            }
                          }}
                          className="bg-white border-2 border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-50 transition-all"
                        >
                          Disable 2FA
                        </button>
                      ) : (
                        <button
                          onClick={() => setShow2FASetup(!show2FASetup)}
                          className="bg-[#FF8C42] text-white px-6 py-2 rounded-lg hover:bg-[#ff7a2e] transition-all"
                        >
                          Enable 2FA
                        </button>
                      )}
                    </div>

                    {/* 2FA Setup UI */}
                    {show2FASetup && !twoFactorEnabled && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold text-gray-800 mb-4">Set Up Authenticator App</h4>
                        <ol className="text-sm text-gray-700 space-y-2 mb-4">
                          <li>1. Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                          <li>2. Scan this QR code with your app:</li>
                        </ol>
                        <div className="bg-gray-100 p-8 rounded-lg text-center mb-4">
                          <div className="text-6xl">📱</div>
                          <p className="text-sm text-gray-500 mt-2">QR Code Placeholder</p>
                          <p className="text-xs text-gray-400 mt-1">In production: Display actual QR code</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="text-xs text-gray-500 mb-2">Or enter this code manually:</p>
                          <code className="text-sm font-mono text-gray-800">ABCD-EFGH-IJKL-MNOP</code>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm text-gray-700 mb-2">Enter 6-digit code from your app:</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF8C42] focus:outline-none"
                            id="twoFactorCode"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const code = (document.getElementById('twoFactorCode') as HTMLInputElement)?.value;
                            if (code && code.length === 6) {
                              setTwoFactorEnabled(true);
                              setShow2FASetup(false);
                              localStorage.setItem('twoFactorEnabled', 'true');
                              showToastMessage('✅ Two-factor authentication enabled!', 'success');
                            } else {
                              showToastMessage('⚠️ Please enter a 6-digit code', 'warning');
                            }
                          }}
                          className="w-full bg-[#FF8C42] text-white py-3 rounded-lg hover:bg-[#ff7a2e] transition-all font-semibold"
                        >
                          Verify & Enable 2FA
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sessions Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Sessions</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">Current Session</p>
                          <p className="text-sm text-gray-600">Chrome on Windows • Last active: Now</p>
                        </div>
                        <span className="text-green-600 text-sm">● Active</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        showToastMessage('🔐 All other sessions signed out', 'success');
                      }}
                      className="w-full bg-white border-2 border-[#FF8C42] text-[#FF8C42] py-2 rounded-lg hover:bg-orange-50 transition-all"
                    >
                      Sign Out All Other Sessions
                    </button>
                  </div>
                </div>
              )}

              {/* PRIVACY SECTION */}
              {settingsSection === 'privacy' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">Privacy</h1>
                  <p className="text-gray-600 mb-8">Control who can see your profile and content</p>

                  {/* Profile Visibility Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile Visibility</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">Public Profile</p>
                          <p className="text-sm text-gray-600">Allow others to view your profile</p>
                        </div>
                        <label className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            onChange={(e) => {
                              localStorage.setItem('privacy_publicProfile', e.target.checked.toString());
                              showToastMessage(
                                e.target.checked ? '✓ Profile is now public' : '✓ Profile is now private',
                                'success'
                              );
                            }}
                          />
                          <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-all peer-checked:bg-[#FF8C42] peer-focus:ring-2 peer-focus:ring-[#FF8C42]/50"></span>
                          <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></span>
                        </label>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">Show in Search Results</p>
                          <p className="text-sm text-gray-600">Allow your profile to appear in searches</p>
                        </div>
                        <label className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                            onChange={(e) => {
                              localStorage.setItem('privacy_searchable', e.target.checked.toString());
                              showToastMessage(
                                e.target.checked ? '✓ Searchable enabled' : '✓ Searchable disabled',
                                'success'
                              );
                            }}
                          />
                          <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-all peer-checked:bg-[#FF8C42] peer-focus:ring-2 peer-focus:ring-[#FF8C42]/50"></span>
                          <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS SECTION */}
              {settingsSection === 'notifications' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">Notifications</h1>
                  <p className="text-gray-600 mb-8">Manage your notification preferences</p>

                  {/* Email Notifications Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'fileProtected', label: 'File Protection Confirmations', desc: 'Receive confirmation when files are protected' },
                        { key: 'licenseRequests', label: 'License Requests', desc: 'Get notified when someone requests a license' },
                        { key: 'securityAlerts', label: 'Security Alerts', desc: 'Important security updates and warnings' },
                        { key: 'productUpdates', label: 'Product Updates', desc: 'New features and improvements' },
                        { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Tips, offers, and newsletters' }
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{label}</p>
                            <p className="text-sm text-gray-600">{desc}</p>
                          </div>
                          <label className="relative inline-block w-12 h-6">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked={key === 'fileProtected' || key === 'securityAlerts'}
                              onChange={(e) => {
                                localStorage.setItem(`notification_${key}`, e.target.checked.toString());
                                showToastMessage('✓ Notification preference updated', 'success');
                              }}
                            />
                            <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-all peer-checked:bg-[#FF8C42] peer-focus:ring-2 peer-focus:ring-[#FF8C42]/50"></span>
                            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING SECTION */}
              {settingsSection === 'billing' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-8">Billing & Subscription</h1>
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Plan</h3>
                    <p className="text-gray-600 mb-4">Manage your subscription and billing information</p>
                    <button
                      onClick={() => setCurrentPage('wallet')}
                      className="bg-[#FF8C42] text-white px-6 py-2 rounded-lg hover:bg-[#ff7a2e] transition-all"
                    >
                      Go to Wallet →
                    </button>
                  </div>
                </div>
              )}

              {/* DATA & EXPORT SECTION */}
              {settingsSection === 'data' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">Data & Export</h1>
                  <p className="text-gray-600 mb-8">Download your data and manage account information</p>

                  {/* Data Export Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Export Your Data</h3>
                    <p className="text-gray-600 mb-6">Download a copy of all your BloomShield data</p>
                    <button
                      onClick={() => {
                        const exportData = {
                          profile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
                          wallet: JSON.parse(localStorage.getItem('userWallet') || '{}'),
                          files: JSON.parse(localStorage.getItem('protectedFiles') || '[]'),
                          settings: {
                            twoFactorEnabled: localStorage.getItem('twoFactorEnabled'),
                            notifications: Object.keys(localStorage).filter(k => k.startsWith('notification_')),
                            privacy: Object.keys(localStorage).filter(k => k.startsWith('privacy_'))
                          },
                          exportDate: new Date().toISOString()
                        };

                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `bloomshield-data-${Date.now()}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        showToastMessage('✅ Data exported successfully!', 'success');
                      }}
                      className="bg-[#FF8C42] text-white px-6 py-3 rounded-lg hover:bg-[#ff7a2e] transition-all font-semibold"
                    >
                      📥 Download My Data
                    </button>
                  </div>
                </div>
              )}

              {/* ADVANCED SECTION */}
              {settingsSection === 'advanced' && (
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">Advanced Settings</h1>
                  <p className="text-gray-600 mb-8">API access and account management</p>

                  {/* API Keys Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">API Keys</h3>
                    <p className="text-gray-600 mb-4">Manage API keys for programmatic access</p>

                    {apiKeys.length === 0 ? (
                      <p className="text-gray-500 text-sm mb-4">No API keys yet</p>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-800">{key.name}</p>
                              <p className="text-sm text-gray-500">Created: {key.created}</p>
                              <code className="text-xs font-mono text-gray-600">{key.key.substring(0, 20)}...</code>
                            </div>
                            <button
                              onClick={() => {
                                const confirmed = confirm(`Revoke API key "${key.name}"?`);
                                if (confirmed) {
                                  const updated = apiKeys.filter(k => k.id !== key.id);
                                  setApiKeys(updated);
                                  localStorage.setItem('apiKeys', JSON.stringify(updated));
                                  showToastMessage('🗑️ API key revoked', 'success');
                                }
                              }}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-all text-sm"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const name = prompt('Enter a name for this API key:');
                        if (name) {
                          const newKey = {
                            id: Date.now().toString(),
                            name: name,
                            key: 'bs_' + Array.from({length: 32}, () =>
                              'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
                            ).join(''),
                            created: new Date().toLocaleDateString(),
                            lastUsed: 'Never'
                          };

                          alert(`API Key Created!\n\n${newKey.key}\n\nCopy this now - you won't see it again!`);

                          const updated = [...apiKeys, newKey];
                          setApiKeys(updated);
                          localStorage.setItem('apiKeys', JSON.stringify(updated));
                          showToastMessage('✅ API key created', 'success');
                        }
                      }}
                      className="bg-[#FF8C42] text-white px-6 py-2 rounded-lg hover:bg-[#ff7a2e] transition-all"
                    >
                      + Generate New API Key
                    </button>
                  </div>

                  {/* Danger Zone Card */}
                  <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6">
                    <h3 className="text-xl font-semibold text-red-600 mb-4">⚠️ Danger Zone</h3>

                    <div className="bg-[#E8F5E9] border-l-4 border-green-500 p-4 rounded-lg mb-6">
                      <p className="text-sm font-semibold text-gray-800 mb-1">✓ Important: Blockchain Protection</p>
                      <p className="text-xs text-gray-700">
                        Deleting your BloomShield account will NOT delete your blockchain records.
                        Your ownership proofs remain permanent and verifiable forever through your wallet address.
                      </p>
                    </div>

                    <p className="text-gray-700 mb-4">
                      This will permanently delete your account, profile data, and remove access to the BloomShield platform.
                      This action cannot be undone.
                    </p>
                    <button
                      onClick={() => {
                        const confirmation = prompt('Type "DELETE" in capital letters to confirm account deletion:');
                        if (confirmation === 'DELETE') {
                          const finalConfirm = confirm(
                            '⚠️ FINAL WARNING\n\n' +
                            'This will permanently delete your account.\n\n' +
                            'Your blockchain records will remain, but you will lose access to this account.\n\n' +
                            'Click OK to proceed with deletion.'
                          );
                          if (finalConfirm) {
                            localStorage.clear();
                            showToastMessage('🗑️ Account deleted. Reloading...', 'success');
                            setTimeout(() => window.location.reload(), 2000);
                          }
                        } else if (confirmation !== null) {
                          showToastMessage('⚠️ Deletion cancelled - you must type DELETE exactly', 'warning');
                        }
                      }}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all font-semibold"
                    >
                      Delete Account
                    </button>
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

      {/* Auth Modal (Login/Signup/Reset) */}
      <AuthModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignUpSuccess={handleSignUpSuccess}
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
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowSeedPhraseModal(false);
                setSeedPhraseAcknowledged(false);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
            >
              ×
            </button>

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
                  checked={seedPhraseAcknowledged}
                  onChange={(e) => setSeedPhraseAcknowledged(e.target.checked)}
                  className="w-5 h-5 mr-3 cursor-pointer accent-[#FF8C42]"
                />
                <span className="text-gray-700">I have written down my recovery phrase in a safe place</span>
              </label>
            </div>

            <button
              disabled={!seedPhraseAcknowledged}
              onClick={() => {
                localStorage.setItem('seedPhraseAcknowledged', 'true');
                setShowSeedPhraseModal(false);
                setSeedPhraseAcknowledged(false);
                setCurrentPage('dashboard');
                showToastMessage('✅ Wallet created! Your ownership is now permanent.', 'success');
              }}
              className={seedPhraseAcknowledged
                ? 'w-full bg-[#FF8C42] text-white py-4 rounded-lg font-bold text-lg cursor-pointer hover:bg-[#ff7a2e] transition-all'
                : 'w-full bg-gray-300 text-white py-4 rounded-lg font-bold text-lg cursor-not-allowed'}
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
          onClose={() => {
            setShowCertificate(false);
            setCertificateData(null); // Clear data to prevent reopening
          }}
          data={certificateData}
          onNavigateToDashboard={handleNavigateToDashboard}
        />
      )}

      {/* Listing Modal */}
      {showListingModal && assetToList && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowListingModal(false);
                setAssetToList(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">List {assetToList.fileName} on Marketplace</h2>
            <p className="text-gray-600 mb-6">Set your pricing and license terms</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const listingType = formData.get('listingType') as string;

                handleConfirmListing({
                  salePrice: parseFloat(formData.get('salePrice') as string) || 0,
                  allowLease: listingType === 'lease' || listingType === 'both',
                  leasePrice1Month: parseFloat(formData.get('lease1Month') as string) || 0,
                  leasePrice6Month: parseFloat(formData.get('lease6Month') as string) || 0,
                  leasePrice1Year: parseFloat(formData.get('lease1Year') as string) || 0,
                  commercialUse: formData.get('commercialUse') === 'on',
                  attribution: formData.get('attribution') === 'on'
                });
              }}
            >
              {/* Listing Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Listing Type:</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      value="sale"
                      defaultChecked
                      className="w-4 h-4 mr-2 accent-[#FF8C42]"
                      onChange={(e) => {
                        const saleSection = document.getElementById('saleSection');
                        const leaseSection = document.getElementById('leaseSection');
                        if (saleSection && leaseSection) {
                          saleSection.style.display = 'block';
                          leaseSection.style.display = 'none';
                        }
                      }}
                    />
                    <span>Sale Only</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      value="lease"
                      className="w-4 h-4 mr-2 accent-[#FF8C42]"
                      onChange={(e) => {
                        const saleSection = document.getElementById('saleSection');
                        const leaseSection = document.getElementById('leaseSection');
                        if (saleSection && leaseSection) {
                          saleSection.style.display = 'none';
                          leaseSection.style.display = 'block';
                        }
                      }}
                    />
                    <span>Lease Only</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      value="both"
                      className="w-4 h-4 mr-2 accent-[#FF8C42]"
                      onChange={(e) => {
                        const saleSection = document.getElementById('saleSection');
                        const leaseSection = document.getElementById('leaseSection');
                        if (saleSection && leaseSection) {
                          saleSection.style.display = 'block';
                          leaseSection.style.display = 'block';
                        }
                      }}
                    />
                    <span>Both (Sale + Lease)</span>
                  </label>
                </div>
              </div>

              {/* Sale Price */}
              <div id="saleSection" className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Price (USD):</label>
                <input
                  type="number"
                  name="salePrice"
                  min="1"
                  step="0.01"
                  placeholder="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                />
              </div>

              {/* Lease Pricing */}
              <div id="leaseSection" className="mb-6" style={{ display: 'none' }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lease Pricing:</label>
                <div className="space-y-3">
                  <input
                    type="number"
                    name="lease1Month"
                    min="1"
                    step="0.01"
                    placeholder="1 Month Price ($50)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  />
                  <input
                    type="number"
                    name="lease6Month"
                    min="1"
                    step="0.01"
                    placeholder="6 Months Price ($250)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  />
                  <input
                    type="number"
                    name="lease1Year"
                    min="1"
                    step="0.01"
                    placeholder="1 Year Price ($400)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  />
                </div>
              </div>

              {/* License Terms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">License Terms:</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="commercialUse"
                      defaultChecked
                      className="w-4 h-4 mr-2 accent-[#FF8C42]"
                    />
                    <span>Commercial use allowed</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="attribution"
                      defaultChecked
                      className="w-4 h-4 mr-2 accent-[#FF8C42]"
                    />
                    <span>Attribution required</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#FF8C42] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#ff7a2e] transition-all"
              >
                Publish to Marketplace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showAssetDetail && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl relative my-8">
            {/* Close button */}
            <button
              onClick={() => {
                setShowAssetDetail(false);
                setSelectedAsset(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Preview */}
              <div>
                <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl h-64 flex items-center justify-center mb-4">
                  <div className="text-8xl">{getFileIcon(selectedAsset.fileType)}</div>
                </div>

                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center">
                  <p className="font-semibold mb-1">✓ Verified on Polygon Blockchain</p>
                  <button
                    onClick={() => window.open(`https://polygonscan.com/tx/${selectedAsset.blockchainTx}`, '_blank')}
                    className="text-sm underline hover:text-green-900"
                  >
                    View Transaction
                  </button>
                </div>
              </div>

              {/* Right: Info & Purchase */}
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedAsset.fileName}</h2>
                <p className="text-gray-600 mb-4">Protected creative asset</p>

                <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">Creator:</span>
                    <span>{selectedAsset.creator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Protected:</span>
                    <span>{getRelativeDate(selectedAsset.protectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Asset ID:</span>
                    <span className="font-mono text-xs">{selectedAsset.assetId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">File Type:</span>
                    <span>{selectedAsset.fileType}</span>
                  </div>
                </div>

                {/* Purchase Options */}
                {selectedAsset.salePrice > 0 && (
                  <div className="bg-[#FFF5F0] border-2 border-[#FF8C42] p-6 rounded-xl mb-4">
                    <h3 className="font-bold text-xl text-gray-800 mb-2">Buy Outright</h3>
                    <div className="text-4xl font-bold text-[#FF8C42] mb-3">${selectedAsset.salePrice}</div>
                    <p className="text-sm text-gray-600 mb-4">Full ownership transfer. You can use commercially and resell.</p>
                    <button
                      onClick={handlePurchaseAsset}
                      className="w-full bg-[#FF8C42] text-white py-3 rounded-lg font-bold hover:bg-[#ff7a2e] transition-all"
                    >
                      Buy Now
                    </button>
                  </div>
                )}

                {/* Lease Options */}
                {selectedAsset.allowLease && (
                  <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-xl">
                    <h3 className="font-bold text-xl text-gray-800 mb-3">Lease</h3>
                    <p className="text-sm text-gray-600 mb-4">Time-limited usage rights</p>

                    <div className="space-y-2">
                      {selectedAsset.leasePrice1Month > 0 && (
                        <button
                          onClick={() => handleLeaseAsset('1 Month', selectedAsset.leasePrice1Month)}
                          className="w-full bg-white border-2 border-purple-300 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-100 transition-all flex justify-between items-center px-4"
                        >
                          <span>1 Month</span>
                          <span className="font-bold">${selectedAsset.leasePrice1Month}</span>
                        </button>
                      )}
                      {selectedAsset.leasePrice6Month > 0 && (
                        <button
                          onClick={() => handleLeaseAsset('6 Months', selectedAsset.leasePrice6Month)}
                          className="w-full bg-white border-2 border-purple-300 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-100 transition-all flex justify-between items-center px-4"
                        >
                          <span>6 Months</span>
                          <span className="font-bold">${selectedAsset.leasePrice6Month}</span>
                        </button>
                      )}
                      {selectedAsset.leasePrice1Year > 0 && (
                        <button
                          onClick={() => handleLeaseAsset('1 Year', selectedAsset.leasePrice1Year)}
                          className="w-full bg-white border-2 border-purple-300 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-100 transition-all flex justify-between items-center px-4"
                        >
                          <span>1 Year</span>
                          <span className="font-bold">${selectedAsset.leasePrice1Year}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* License Terms */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">License Terms</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>{selectedAsset.commercialUse ? '✓' : '✗'} Commercial use allowed</li>
                    <li>{selectedAsset.attribution ? '✓' : '✗'} Attribution required</li>
                    <li>✓ Blockchain verified ownership</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
