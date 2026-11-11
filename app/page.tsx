'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import BillingPlans from '@/components/BillingPlans';
import SecuritySettings from '@/components/SecuritySettings';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import TopBar from '@/components/TopBar';
import WorkspaceIcon from '@/components/WorkspaceIcon';
import Toast from '@/components/Toast';
import CertificateModal from '@/components/CertificateModal';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import AuthModal from '@/components/AuthModal';
import { onAuthStateChange, logout } from '@/lib/auth';
import { UserProfile } from '@/types/user';

function FileSummary({ icon, name, date, assetId }: {
  icon: string;
  name: string;
  date: string;
  assetId: string;
}) {
  return (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-workspace-field text-xl" aria-hidden="true">
        {icon}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-sm font-semibold text-workspace-text" title={name}>{name}</span>
        <span className="text-sm text-workspace-muted">Protected {date}</span>
        <span className="truncate font-mono text-xs text-workspace-muted" title={assetId}>{assetId}</span>
      </span>
    </>
  );
}

export default function Home() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const hasSession = useRef(false);
  const fileOwner = useRef<string | null>(null);
  const uploadInProgress = useRef(false);

  // Page navigation state
  const [currentPage, setCurrentPage] = useState('home');
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      localStorage.removeItem('protectedFiles');
      localStorage.removeItem('userPassword');
      localStorage.removeItem('twoFactorEnabled');

      // Load API keys
      const keys = localStorage.getItem('apiKeys');
      if (keys) {
        setApiKeys(JSON.parse(keys));
      }
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    let sequence = 0;
    const { data: { subscription } } = onAuthStateChange((user) => {
      const event = ++sequence;
      setTimeout(async () => {
        if (user) {
          const { data, error } = await getSupabaseBrowserClient().auth.mfa.getAuthenticatorAssuranceLevel();
          if (event !== sequence || error || !data) return;
          if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
            window.location.replace('/auth/mfa');
            return;
          }
        }
        if (event === sequence) applyUser(user);
      }, 0);
    });
    function applyUser(user: UserProfile | null) {
      if (fileOwner.current !== (user?.id ?? null)) {
        fileOwner.current = user?.id ?? null;
        setProtectedFiles([]);
        setMarketplaceAssets([]);
        setCertificateData(null);
        setShowCertificate(false);
      }
      setCurrentUser(user);
      setIsLoggedIn(!!user);
      if (user && !hasSession.current) setCurrentPage('dashboard');
      hasSession.current = !!user;

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

        // Fetch protected files from Supabase database
        const fetchProtectedFiles = async () => {
          try {
            const supabase = getSupabaseClient();
            if (!supabase) return;

            const { data, error } = await supabase
              .from('protected_files')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching protected files:', error);
              return;
            }

            if (data && fileOwner.current === user.id) {
              // Map DB records to the format the UI expects
              const files = data.map((record: any) => ({
                assetId: record.floral_hash || record.floral_id || '',
                fileName: record.file_name || record.name || '',
                fileType: record.mime_type || record.file_type || 'Unknown',
                fileSize: record.file_size ? `${(record.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                protectedDate: record.created_at,
                creator: user.name || 'Anonymous',
                email: user.email || '',
                legalHash: record.legal_hash || '',
                contentHash: record.content_hash || '',
                floralHash: record.floral_hash || '',
                blockchainTx: record.blockchain_tx || record.blockchain_hash || '',
                ownerWallet: user.walletAddress || 'No wallet',
                ipfsHash: record.ipfs_hash || '',
                storagePath: record.storage_path || '',
                isListed: record.metadata?.isListed || false,
                listingPrice: record.metadata?.listingPrice || '',
                listingLicense: record.metadata?.listingLicense || '',
                dbId: record.id,
              }));

              setProtectedFiles(files);

              // Load marketplace listings
              const listedAssets = files.filter((file: any) => file.isListed);
              setMarketplaceAssets(listedAssets);
            }
          } catch (err) {
            console.error('Error fetching protected files:', err);
          }
        };
        fetchProtectedFiles();

      } else {
        setUserWallet(null);
        setCurrentPage('home');
        setIsSidebarActive(false);
      }
    }

    return () => { sequence++; subscription.unsubscribe(); };
  }, []);

  // Supabase client initialization - uses SSR-compatible client
  const getSupabaseClient = () => {
    if (typeof window === 'undefined') return null;
    const { getSupabaseBrowserClient } = require('@/lib/supabase/client');
    return getSupabaseBrowserClient();
  };

  // PRESERVED: Hash generation function
  // Helper function to compute dHash (difference hash) for images
  const computeDHash = async (file: File): Promise<string> => {
    try {
      // Try to load as image
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 9;
            canvas.height = 8;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Draw image on canvas (will be resized to 9x8)
            ctx.drawImage(img, 0, 0, 9, 8);

            // Get grayscale pixel data
            const imageData = ctx.getImageData(0, 0, 9, 8);
            const data = imageData.data;
            const grayscale = [];

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // Convert to grayscale using luminosity method
              const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              grayscale.push(gray);
            }

            // Compute difference hash (64-bit)
            let hash = BigInt(0);
            for (let i = 0; i < 64; i++) {
              // Compare horizontally adjacent pixels
              const row = Math.floor(i / 8);
              const col = i % 8;
              const idx = row * 9 + col;
              if (idx + 1 < grayscale.length) {
                const bit = grayscale[idx] > grayscale[idx + 1] ? 1 : 0;
                hash |= BigInt(bit) << BigInt(i);
              }
            }

            // Convert to 16-char hex string with 0x prefix
            const hashHex = '0x' + hash.toString(16).padStart(16, '0');
            URL.revokeObjectURL(url);
            resolve(hashHex);
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };

        img.src = url;
      });
    } catch (error) {
      throw error;
    }
  };

  const generateHashes = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Legal Hash (SHA-256)
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const legal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Content Hash (Perceptual - dHash for images, SHA-256 for non-images)
      let content: string;
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        try {
          content = await computeDHash(file);
        } catch (dHashError) {
          console.warn('dHash computation failed, falling back to SHA-256:', dHashError);
          // Fallback to SHA-256 of first 64KB for non-image or failed dHash
          const firstChunk = arrayBuffer.slice(0, 65536);
          const fallbackHash = await crypto.subtle.digest('SHA-256', firstChunk);
          const fallbackArray = Array.from(new Uint8Array(fallbackHash));
          const fallbackHex = fallbackArray.map(b => b.toString(16).padStart(2, '0')).join('');
          content = '0x' + fallbackHex.substring(0, 16);
        }
      } else {
        // For non-image files, use SHA-256 of first 64KB
        const firstChunk = arrayBuffer.slice(0, 65536);
        const fallbackHash = await crypto.subtle.digest('SHA-256', firstChunk);
        const fallbackArray = Array.from(new Uint8Array(fallbackHash));
        const fallbackHex = fallbackArray.map(b => b.toString(16).padStart(2, '0')).join('');
        content = '0x' + fallbackHex.substring(0, 16);
      }

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
    if (!fileToUpload || !currentUser || uploadInProgress.current) return;
    const user = currentUser;
    uploadInProgress.current = true;


    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('File storage is unavailable.');
      const { data: plan, error: planError } = await supabase.rpc('bloomshield_plan');
      if (planError || !plan) throw new Error('Could not check this workspace’s upload limit.');
      if (plan.limit !== null && plan.used >= plan.limit) {
        throw new Error('Monthly asset limit reached. See Workspace billing for plan options.');
      }

      // Show processing overlay
      setShowCertificate(false);
      setCertificateData(null);
      setShowProcessing(true);
      setProcessingStep(1);

      // Step 1: Generate Hashes
      setUploadStatus('Generating protection hashes...');
      const hashes = await generateHashes(fileToUpload);
      setLegalHash(hashes.legal);
      setContentHash(hashes.content);
      setFloralHash(hashes.floral);

      setProcessingStep(2);

      // Step 2: Pin metadata to IPFS via Pinata — gets Hash #4 (IPFS CID)
      setUploadStatus('📌 Pinning to decentralized storage...');
      setProcessingStep(3);

      const pinResponse = await fetch('/api/ipfs/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legalHash: hashes.legal, contentHash: hashes.content, floralHash: hashes.floral }),
      });
      const pin = await pinResponse.json();
      if (!pinResponse.ok || !pin.ipfsHash) {
        throw new Error('Metadata storage is unavailable. Please try again.');
      }
      const ipfsHash: string = pin.ipfsHash;

      setProcessingStep(4);
      const response = await fetch('/api/blockchain/timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalHash: hashes.legal,
          contentHash: hashes.content,
          floralHash: hashes.floral,
          ipfsHash,
        }),
      });
      const result = await response.json();
      const blockchainTransactionHash = result.blockchain?.transactionHash;
      if (!response.ok || !/^0x[0-9a-f]{64}$/i.test(blockchainTransactionHash ?? '')) {
        throw new Error('Polygon could not confirm the timestamp. No certificate was issued.');
      }
      const blockchainTimestamp = new Date(result.blockchain.timestamp).toISOString();

      // Step 4: Upload to Supabase Storage
      setUploadStatus('Uploading to secure storage...');
      setProcessingStep(5);

      const fileName = `${user.id}/${crypto.randomUUID()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('protected-files')
        .upload(fileName, fileToUpload);

      if (uploadError) {
        throw uploadError;
      }


      // Step 5: Save to Database — all 5 hashes + storage path
      setUploadStatus('Saving protection record...');
      setProcessingStep(6);
      const { data: dbData, error: dbError} = await supabase
        .from('protected_files')
        .insert({
          user_id: user.id,
          name: fileToUpload.name,
          file_size: fileToUpload.size,
          file_type: fileToUpload.type,
          mime_type: fileToUpload.type,
          storage_path: uploadData?.path || fileName,
          legal_hash: hashes.legal,
          content_hash: hashes.content,
          floral_hash: hashes.floral,
          floral_id: hashes.floral,
          blockchain_tx: blockchainTransactionHash,
          blockchain_hash: blockchainTransactionHash,
          blockchain_timestamp: blockchainTimestamp,
          ipfs_hash: ipfsHash,
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from('protected-files').remove([fileName]);
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message || 'Failed to save protection record'}`);
      }

      setRecordId(dbData.id);


      // Prepare certificate data with actual file information + blockchain info
      const certData = {
        assetId: hashes.floral,
        fileName: fileToUpload.name,
        fileType: fileToUpload.type || 'Unknown',
        fileSize: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
        protectedDate: new Date().toISOString(),
        creator: currentUser?.name || 'Anonymous',
        email: currentUser?.email || 'no-email@bloomshield.local',
        legalHash: hashes.legal,
        contentHash: hashes.content,
        floralHash: hashes.floral,
        blockchainTx: blockchainTransactionHash,
        ownerWallet: user.walletAddress,
        storagePath: uploadData?.path || fileName,
        ipfsHash: ipfsHash,
      };
      if (fileOwner.current === user.id) {
        setCertificateData(certData);
        setProtectedFiles(files => [certData, ...files]);
        setShowCertificate(true);
        showToastMessage('File stored and Polygon timestamp confirmed.', 'success');
      }

    } catch (error) {
      console.error('Upload error:', error);
      showToastMessage(error instanceof Error ? error.message : 'File protection failed.', 'error');
    } finally {
      uploadInProgress.current = false;
      setShowProcessing(false);
      setProcessingStep(0);
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
    // The auth listener applies the session after checking MFA assurance.

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
      if (user.walletSeedPhrase && !seedPhraseAck) {
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
  const handleConfirmListing = (listingData: any) => {
    if (!assetToList) return;

    // Update the asset with listing information
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

    // Update marketplace assets
    const listedAssets = updatedFiles.filter(file => file.isListed);
    setMarketplaceAssets(listedAssets);

    setShowListingModal(false);
    setAssetToList(null);

    showToastMessage('✅ Asset listed on marketplace!', 'success');
  };

  // Unlist asset from marketplace
  const handleUnlistAsset = (assetId: string) => {
    const updatedFiles = protectedFiles.map(file =>
      file.assetId === assetId ? { ...file, isListed: false, salePrice: 0 } : file
    );

    setProtectedFiles(updatedFiles);

    // Update marketplace assets
    const listedAssets = updatedFiles.filter(file => file.isListed);
    setMarketplaceAssets(listedAssets);

    showToastMessage('✅ Asset removed from marketplace', 'success');
  };

  // View asset details
  const handleViewAsset = (asset: any) => {
    setSelectedAsset(asset);
    setShowAssetDetail(true);
  };

  // Purchase asset
  const handlePurchaseAsset = () => {
    if (!selectedAsset || !currentUser) {
      showToastMessage('⚠️ Please log in to purchase', 'warning');
      return;
    }

    if (selectedAsset.creator === currentUser.name) {
      showToastMessage('⚠️ You cannot buy your own asset', 'warning');
      return;
    }

    const confirmed = confirm(
      `Purchase ${selectedAsset.fileName} for $${selectedAsset.salePrice}?\n\nThis will transfer ownership to you.`
    );

    if (!confirmed) return;

    // Simulate purchase (in production, this would call blockchain + Stripe)
    const purchaseTx = '0x' + Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');

    // Update asset ownership
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

    // Update marketplace
    const listedAssets = updatedFiles.filter(file => file.isListed);
    setMarketplaceAssets(listedAssets);

    setShowAssetDetail(false);
    setSelectedAsset(null);

    showToastMessage('✅ Purchase successful! Asset is now yours.', 'success');
  };

  // Lease asset
  const handleLeaseAsset = (duration: string, price: number) => {
    if (!selectedAsset || !currentUser) {
      showToastMessage('⚠️ Please log in to lease', 'warning');
      return;
    }

    if (selectedAsset.creator === currentUser.name) {
      showToastMessage('⚠️ You cannot lease your own asset', 'warning');
      return;
    }

    const confirmed = confirm(
      `Lease ${selectedAsset.fileName} for ${duration} at $${price}?`
    );

    if (!confirmed) return;

    // Simulate lease transaction
    const leaseTx = '0x' + Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');

    // Calculate end date
    const durationDays = duration === '1 Month' ? 30 : duration === '6 Months' ? 180 : 365;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Store lease in localStorage
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

    showToastMessage('✅ Lease created successfully!', 'success');
  };

  // Search marketplace
  const handleMarketplaceSearch = () => {
    if (!marketplaceSearchQuery.trim()) {
      // Reload all listings if search is empty
      const listedAssets = protectedFiles.filter(file => file.isListed);
      setMarketplaceAssets(listedAssets);
      return;
    }

    const query = marketplaceSearchQuery.toLowerCase();
    const results = protectedFiles.filter(file => {
      if (!file.isListed) return false;

      return (
        file.fileName?.toLowerCase().includes(query) ||
        file.creator?.toLowerCase().includes(query) ||
        file.assetId?.toLowerCase().includes(query) ||
        file.fileType?.toLowerCase().includes(query)
      );
    });

    setMarketplaceAssets(results);

    if (results.length === 0) {
      showToastMessage(`No results found for "${marketplaceSearchQuery}"`, 'warning');
    }
  };

  // Apply marketplace filters
  const handleApplyFilters = () => {
    let filtered = protectedFiles.filter(file => file.isListed);

    // Filter by type
    if (marketplaceFilters.type !== 'all') {
      filtered = filtered.filter(file =>
        file.fileType?.toLowerCase().includes(marketplaceFilters.type)
      );
    }

    // Filter by license
    if (marketplaceFilters.license === 'sale') {
      filtered = filtered.filter(file => file.salePrice > 0);
    } else if (marketplaceFilters.license === 'lease') {
      filtered = filtered.filter(file => file.allowLease);
    }

    // Filter by price
    if (marketplaceFilters.price !== 'all') {
      const [min, max] = marketplaceFilters.price.includes('+')
        ? [1000, Infinity]
        : marketplaceFilters.price.split('-').map(Number);

      filtered = filtered.filter(file => {
        const price = file.salePrice || 0;
        return price >= min && price <= (max || Infinity);
      });
    }

    // Sort
    if (marketplaceFilters.sort === 'newest') {
      filtered.sort((a, b) => new Date(b.protectedDate || 0).getTime() - new Date(a.protectedDate || 0).getTime());
    } else if (marketplaceFilters.sort === 'price-low') {
      filtered.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    } else if (marketplaceFilters.sort === 'price-high') {
      filtered.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
    }

    setMarketplaceAssets(filtered);
    showToastMessage(`Found ${filtered.length} assets`, 'success');
  };

  // Handle navigation
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setIsSidebarActive(false);
  };

  // Handle sidebar toggle
  const handleToggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
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
    setSettingsSection('billing');
    setCurrentPage('settings');
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
    setSettingsSection('security');
    setCurrentPage('settings');
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
    <div className={isLoggedIn ? 'workspace min-h-screen' : 'min-h-screen bg-gray-50'}>
      <TopBar
        onLogin={handleLogin}
        isLoggedIn={isLoggedIn}
        onToggleSidebar={handleToggleSidebar}
        onLogoClick={() => handleNavigate(isLoggedIn ? 'dashboard' : 'home')}
        sidebarOpen={isSidebarActive}
        sidebarCollapsed={isSidebarCollapsed}
        onCollapseSidebar={() => setIsSidebarCollapsed(collapsed => !collapsed)}
        accountName={currentUser?.name}
        onProfile={() => handleNavigate('profile')}
      />

      <div className={isLoggedIn
        ? `md:grid ${isSidebarCollapsed ? 'md:grid-cols-[4rem_minmax(0,1fr)]' : 'md:grid-cols-[14rem_minmax(0,1fr)]'}`
        : undefined}
      >
        {isLoggedIn && (
          <>
            {isSidebarActive && (
              <button
                type="button"
                aria-label="Close workspace navigation"
                className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/60 md:hidden"
                onClick={() => setIsSidebarActive(false)}
              />
            )}
            <Sidebar
              isActive={isSidebarActive}
              isCollapsed={isSidebarCollapsed}
              onNavigate={handleNavigate}
              currentPage={currentPage}
            />
          </>
        )}
        <main className="min-w-0">
        {/* Toast Notification */}
        <Toast
          message={toastMessage}
          type={toastType}
          show={showToast}
          onClose={() => setShowToast(false)}
        />

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div className="relative min-h-[calc(100vh-70px)] overflow-hidden flex flex-col">
            {/* Hero Image Background */}
            <div className="absolute inset-0">
              <img
                src="/images/bloomshield-hero.png"
                alt=""
                className="w-full h-full object-cover object-right"
              />
              {/* Left gradient overlay for text readability */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, rgba(20,15,30,0.75) 0%, rgba(20,15,30,0.5) 30%, rgba(20,15,30,0.15) 55%, transparent 70%)'
              }} />
              {/* Bottom gradient for CTA bar */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to top, rgba(20,15,30,0.6) 0%, rgba(20,15,30,0.2) 20%, transparent 40%)'
              }} />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex items-center">
              <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
                <div className="max-w-xl">
                  <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-6" style={{ textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}>
                    Protect Your Creative Work
                  </h1>
                  <p className="text-base md:text-lg text-white/75 leading-relaxed max-w-md" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.3)' }}>
                    Save private originals and verify your digital assets with blockchain timestamps.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom CTA Bar */}
            <div className="relative z-10 pb-8 px-4 md:px-12 lg:px-16">
              <div className="max-w-2xl mx-auto">
                {/* Upload CTA */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      setShowLoginModal(true);
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="w-full group"
                >
                  <div className="bg-[#1a1a2e]/80 backdrop-blur-lg rounded-2xl px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 md:gap-5 border-2 border-dashed border-white/25 hover:border-white/40 transition-all hover:bg-[#1a1a2e]/90 shadow-2xl cursor-pointer">
                    {/* Shield Icon */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.13 9.37-7 10.5-3.87-1.13-7-5.67-7-10.5V6.3l7-3.12z" />
                        <path d="M12 7l-4 2v3c0 2.5 1.7 4.8 4 5.5 2.3-.7 4-3 4-5.5V9l-4-2z" opacity="0.5" />
                      </svg>
                    </div>
                    {/* Text */}
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-white font-bold text-base md:text-lg">Protect Your Work</div>
                      <div className="text-white/45 text-sm truncate">
                        {selectedFile
                          ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                          : 'Click to choose files or drag & drop. The Free plan includes 3 assets per month.'
                        }
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="text-white/25 group-hover:text-white/60 transition-colors shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 mt-4 text-white/45 text-xs md:text-sm">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 text-green-400/60" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 text-green-400/60" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Blockchain Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {currentPage === 'dashboard' && (
          <section>
            <div className="workspace-tabs">
              <nav aria-label="Dashboard sections">
                <button
                  onClick={() => setDashboardSection('overview')}
                  aria-current={dashboardSection === 'overview' ? 'true' : undefined}
                >
                  Overview
                </button>
                <button
                  onClick={() => setDashboardSection('files')}
                  aria-current={dashboardSection === 'files' ? 'true' : undefined}
                >
                  My Files
                </button>
                <button
                  onClick={() => setDashboardSection('monitoring')}
                  aria-current={dashboardSection === 'monitoring' ? 'true' : undefined}
                >
                  Monitoring
                  <span className="text-xs bg-workspace-highlight text-workspace-accent px-2 py-0.5 rounded-full font-bold">PRO</span>
                </button>
                <button
                  onClick={() => setDashboardSection('cases')}
                  aria-current={dashboardSection === 'cases' ? 'true' : undefined}
                >
                  Cases
                  <span className="text-xs bg-workspace-highlight text-workspace-accent px-2 py-0.5 rounded-full font-bold">PRO</span>
                </button>
                <button
                  onClick={() => setDashboardSection('licenses')}
                  aria-current={dashboardSection === 'licenses' ? 'true' : undefined}
                >
                  License Requests
                </button>
              </nav>
            </div>

            {/* Dashboard Main Content */}
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
              {/* OVERVIEW SECTION */}
              {dashboardSection === 'overview' && (
                <div>
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-workspace-accent">Creator workspace</p>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard overview</h1>
                    <p className="mt-2 text-sm text-workspace-muted">Manage and protect your creative work.</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                    <div className="workspace-card p-3">
                      <div className="mb-1 text-sm text-workspace-muted">Total Files Protected</div>
                      <div className="text-2xl font-bold text-workspace-text">{protectedFiles.length}</div>
                    </div>
                    <div className="workspace-card p-3">
                      <div className="mb-1 text-sm text-workspace-muted">Active Monitoring</div>
                      <div className="text-2xl font-bold text-workspace-text">0</div>
                    </div>
                    <div className="workspace-card p-3">
                      <div className="mb-1 text-sm text-workspace-muted">Open Cases</div>
                      <div className="text-2xl font-bold text-workspace-text">0</div>
                    </div>
                    <div className="workspace-card p-3">
                      <div className="mb-1 text-sm text-workspace-muted">License Requests</div>
                      <div className="text-2xl font-bold text-workspace-text">3</div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,21rem)]">
                    <section className="min-w-0">
                      {/* Recent Files */}
                      <h2 className="mb-3 text-lg font-bold text-workspace-text">Recent Files</h2>
                      {protectedFiles.length === 0 ? (
                        <div className="workspace-card px-4 py-6 text-center text-workspace-muted">
                          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-workspace-field text-workspace-accent">
                            <WorkspaceIcon name="file" />
                          </div>
                          <p className="text-sm font-semibold text-workspace-text">No files protected yet</p>
                          <p className="mt-1 text-sm">Protect a file to see it here.</p>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {protectedFiles.slice(0, 4).map((file, index) => (
                            <button
                              key={index}
                              type="button"
                              className="file-card flex min-w-0 items-center gap-3 p-3 text-left"
                              onClick={() => {
                                setCertificateData(file);
                                setShowCertificate(true);
                              }}
                            >
                              <FileSummary
                                icon={getFileIcon(file.fileType)}
                                name={file.fileName}
                                date={getRelativeDate(file.protectedDate)}
                                assetId={file.assetId}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                    <aside className="workspace-card order-first self-start p-4 xl:order-none">
                      <h2 className="flex items-center gap-2 text-base font-bold">
                        <span className="text-workspace-accent"><WorkspaceIcon name="shield" /></span>
                        Protect new work
                      </h2>
                      <p className="mb-3 mt-2 break-words text-sm leading-relaxed text-workspace-muted">
                        {selectedFile
                          ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                          : 'Upload a file to generate its blockchain certificate.'}
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="workspace-action min-h-11 w-full rounded-lg px-4 py-2 text-sm"
                      >
                        Choose file
                      </button>
                    </aside>
                  </div>
                </div>
              )}

              {/* MY FILES SECTION */}
              {dashboardSection === 'files' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">My Files</h1>
                  <p className="text-workspace-muted mb-8">All your protected files in one place</p>

                  {protectedFiles.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📁</div>
                      <p className="text-workspace-muted text-lg mb-2">No protected files yet</p>
                      <p className="text-workspace-muted">Upload a file to get started with BloomShield protection</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {protectedFiles.map((file, index) => (
                        <div key={index} className="file-card">
                          <button
                            type="button"
                            className="flex w-full min-w-0 items-center gap-3 p-3 text-left"
                            onClick={() => {
                              setCertificateData(file);
                              setShowCertificate(true);
                            }}
                          >
                            <FileSummary
                              icon={getFileIcon(file.fileType)}
                              name={file.fileName}
                              date={getRelativeDate(file.protectedDate)}
                              assetId={file.assetId}
                            />
                          </button>

                          {/* Action Buttons */}
                          <div className="px-3 pb-3 space-y-2">
                            {file.isListed ? (
                              <div className="space-y-2">
                                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-center py-2 rounded-lg text-sm font-semibold">
                                  ✓ Listed on Marketplace
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlistAsset(file.assetId);
                                  }}
                                  className="min-h-11 w-full bg-workspace-hover text-workspace-text py-2 rounded-lg text-sm font-semibold hover:bg-workspace-hover transition-all"
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
                                className="min-h-11 w-full workspace-action py-2 rounded-lg text-sm font-semibold  transition-all"
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
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Monitoring</h1>

                  <div className="bg-workspace-highlight rounded-2xl p-12 text-center text-white shadow-lg">
                    <h3 className="text-3xl font-bold mb-4">🔍 Unlock Advanced Monitoring</h3>
                    <p className="text-xl mb-8 opacity-95">Track your content across the web and get alerts when copies are detected</p>
                    <button
                      onClick={handleUpgradeToPro}
                      className="bg-workspace-panel text-workspace-accent font-bold py-4 px-10 rounded-lg hover:shadow-xl transition-all text-lg"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {/* CASES SECTION */}
              {dashboardSection === 'cases' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Cases</h1>

                  <div className="bg-workspace-highlight rounded-2xl p-12 text-center text-white shadow-lg">
                    <h3 className="text-3xl font-bold mb-4">⚖️ Unlock Case Management</h3>
                    <p className="text-xl mb-8 opacity-95">Manage infringement cases and work with legal partners to protect your rights</p>
                    <button
                      onClick={handleUpgradeToPro}
                      className="bg-workspace-panel text-workspace-accent font-bold py-4 px-10 rounded-lg hover:shadow-xl transition-all text-lg"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {/* LICENSE REQUESTS SECTION */}
              {dashboardSection === 'licenses' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">License Requests</h1>
                  <p className="text-workspace-muted mb-8">Manage incoming licensing requests for your work</p>

                  <div className="workspace-card px-4 py-8 text-center">
                    <div className="text-6xl mb-4">💼</div>
                    <p className="text-workspace-muted text-lg">No license requests yet</p>
                    <p className="text-workspace-muted text-sm mt-2">When someone requests to license your work, it will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* WALLET PAGE */}
        {currentPage === 'wallet' && (
          <section>
            <div className="workspace-tabs">
              <nav aria-label="Wallet sections">
                <button
                  onClick={() => setWalletSection('overview')}
                  aria-current={walletSection === 'overview' ? 'true' : undefined}
                >
                  Overview
                </button>
                <button
                  onClick={() => setWalletSection('cards')}
                  aria-current={walletSection === 'cards' ? 'true' : undefined}
                >
                  Cards
                </button>
                <button
                  onClick={() => setWalletSection('transactions')}
                  aria-current={walletSection === 'transactions' ? 'true' : undefined}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setWalletSection('deposit')}
                  aria-current={walletSection === 'deposit' ? 'true' : undefined}
                >
                  Direct Deposit
                </button>
                <button
                  onClick={() => setWalletSection('settings')}
                  aria-current={walletSection === 'settings' ? 'true' : undefined}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Wallet Main Content */}
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
              {/* OVERVIEW SECTION */}
              {walletSection === 'overview' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Overview</h1>

                  {/* Balance Display */}
                  <div className="workspace-card p-8 mb-8">
                    <div className="text-workspace-muted text-sm mb-2">Available Balance</div>
                    <div className="text-5xl font-bold text-workspace-text mb-2">$0.00</div>
                    <div className="text-workspace-muted text-sm">Total earnings: $0.00</div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={handleAddMoney}
                      className="bg-[#FF8C42]  text-white font-semibold py-4 px-6 rounded-lg transition-all"
                    >
                      + Add Money
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="bg-workspace-panel border-2 border-workspace-accent text-workspace-accent hover:bg-workspace-highlight font-semibold py-4 px-6 rounded-lg transition-all"
                    >
                      Withdraw
                    </button>
                  </div>

                  {/* Recent Transactions */}
                  <h2 className="text-2xl font-bold text-workspace-text mb-4">Recent Transactions</h2>
                  <div className="workspace-card px-4 py-8 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-workspace-muted">No transactions yet</p>
                  </div>
                </div>
              )}

              {/* CARDS SECTION */}
              {walletSection === 'cards' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">BloomCard</h1>

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
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">Card Color</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setCardColor('blush')}
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 to-pink-200 ${
                          cardColor === 'blush' ? 'ring-4 ring-workspace-accent ring-offset-2' : ''
                        }`}
                      />
                      <button
                        onClick={() => setCardColor('black')}
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 ${
                          cardColor === 'black' ? 'ring-4 ring-workspace-accent ring-offset-2' : ''
                        }`}
                      />
                      <button
                        onClick={() => setCardColor('orange')}
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 ${
                          cardColor === 'orange' ? 'ring-4 ring-workspace-accent ring-offset-2' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="workspace-card p-8 mt-8">
                    <h3 className="text-xl font-semibold text-workspace-text mb-6">Card Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-workspace-muted text-sm mb-1">Card Number</div>
                        <div className="font-semibold">•••• •••• •••• 4242</div>
                      </div>
                      <div>
                        <div className="text-workspace-muted text-sm mb-1">CVV</div>
                        <div className="font-semibold">•••</div>
                      </div>
                      <div>
                        <div className="text-workspace-muted text-sm mb-1">Status</div>
                        <div className="text-emerald-300 font-semibold">● Active</div>
                      </div>
                      <div>
                        <div className="text-workspace-muted text-sm mb-1">Type</div>
                        <div className="font-semibold">Virtual Card</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSACTIONS SECTION */}
              {walletSection === 'transactions' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Transactions</h1>

                  <div className="workspace-card px-4 py-8 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-workspace-muted text-lg">No transactions yet</p>
                    <p className="text-workspace-muted text-sm mt-2">All licensing payments and withdrawals will appear here</p>
                  </div>
                </div>
              )}

              {/* DIRECT DEPOSIT SECTION */}
              {walletSection === 'deposit' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Direct Deposit</h1>

                  <div className="workspace-card px-4 py-8 text-center">
                    <div className="text-6xl mb-4">🏦</div>
                    <p className="text-workspace-muted text-lg mb-6">No bank account connected</p>
                    <button
                      onClick={handleConnectBank}
                      className="bg-[#FF8C42]  text-white font-bold py-3 px-8 rounded-lg transition-all"
                    >
                      Connect Bank Account
                    </button>
                  </div>
                </div>
              )}

              {/* SETTINGS SECTION */}
              {walletSection === 'settings' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Wallet Settings</h1>

                  <div className="workspace-card divide-y">
                    <div className="p-6">
                      <h3 className="font-semibold text-workspace-text mb-2">Payment Notifications</h3>
                      <p className="text-workspace-muted text-sm">Get notified when you receive payments</p>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-workspace-text mb-2">Auto-Withdraw</h3>
                      <p className="text-workspace-muted text-sm">Automatically transfer earnings to your bank</p>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-workspace-text mb-2">Spending Limits</h3>
                      <p className="text-workspace-muted text-sm">Set daily or monthly spending limits</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* MARKETPLACE PAGE */}
        {currentPage === 'marketplace' && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-workspace-text mb-2">Marketplace</h1>
              <p className="text-workspace-muted">License your protected content and earn revenue</p>
            </div>

            {/* Marketplace Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="workspace-card p-6 border-l-4 border-purple-500">
                <div className="text-workspace-muted text-sm mb-2">Listed Items</div>
                <div className="text-3xl font-bold text-workspace-text">0</div>
                <div className="text-xs text-workspace-muted mt-1">Available for license</div>
              </div>
              <div className="workspace-card p-6 border-l-4 border-green-500">
                <div className="text-workspace-muted text-sm mb-2">Active Licenses</div>
                <div className="text-3xl font-bold text-workspace-text">0</div>
                <div className="text-xs text-workspace-muted mt-1">Currently licensed</div>
              </div>
              <div className="workspace-card p-6 border-l-4 border-yellow-500">
                <div className="text-workspace-muted text-sm mb-2">Pending Requests</div>
                <div className="text-3xl font-bold text-workspace-text">0</div>
                <div className="text-xs text-workspace-muted mt-1">Awaiting approval</div>
              </div>
              <div className="workspace-card p-6 border-l-4 border-blue-500">
                <div className="text-workspace-muted text-sm mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-workspace-text">$0</div>
                <div className="text-xs text-workspace-muted mt-1">Lifetime earnings</div>
              </div>
            </div>

            {/* List Content */}
            <div className="bg-workspace-highlight rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-2">List Your Protected Content</h2>
              <p className="text-white/90 mb-6">Set licensing terms and earn passive income from your creations</p>
              <button
                onClick={handleCreateListing}
                className="bg-workspace-panel text-workspace-accent font-bold py-3 px-8 rounded-lg hover:shadow-lg transition-all"
              >
                Create Listing
              </button>
            </div>

            {/* License Types */}
            <div className="workspace-card p-6">
              <h2 className="text-xl font-bold text-workspace-text mb-4">Available License Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-workspace-border rounded-lg hover:border-purple-500 transition-all">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-semibold text-workspace-text mb-1">Personal Use</div>
                  <div className="text-sm text-workspace-muted">Non-commercial projects</div>
                </div>
                <div className="p-4 border-2 border-workspace-border rounded-lg hover:border-purple-500 transition-all">
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-semibold text-workspace-text mb-1">Commercial Use</div>
                  <div className="text-sm text-workspace-muted">Business & marketing</div>
                </div>
                <div className="p-4 border-2 border-workspace-border rounded-lg hover:border-purple-500 transition-all">
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-semibold text-workspace-text mb-1">Exclusive Rights</div>
                  <div className="text-sm text-workspace-muted">Full ownership transfer</div>
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
              <h1 className="text-2xl font-bold text-workspace-text mb-4">Marketplace</h1>
              <p className="text-workspace-muted">Buy or lease creative assets protected on blockchain</p>
            </div>

            {/* Search Bar */}
            <div className="workspace-card p-6 mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={marketplaceSearchQuery}
                  onChange={(e) => setMarketplaceSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleMarketplaceSearch()}
                  placeholder="Search assets by name, creator, or Asset ID..."
                  className="flex-1 px-4 py-3 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                />
                <button
                  onClick={handleMarketplaceSearch}
                  className="workspace-action px-8 py-3 rounded-lg font-semibold  transition-all"
                >
                  🔍 Search
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="workspace-card p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-workspace-text mb-2">Asset Type</label>
                  <select
                    value={marketplaceFilters.type}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, type: e.target.value })}
                    className="w-full px-4 py-2 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
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
                  <label className="block text-sm font-semibold text-workspace-text mb-2">License Type</label>
                  <select
                    value={marketplaceFilters.license}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, license: e.target.value })}
                    className="w-full px-4 py-2 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                  >
                    <option value="all">All</option>
                    <option value="sale">For Sale</option>
                    <option value="lease">For Lease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-workspace-text mb-2">Price Range</label>
                  <select
                    value={marketplaceFilters.price}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, price: e.target.value })}
                    className="w-full px-4 py-2 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                  >
                    <option value="all">Any Price</option>
                    <option value="0-50">$0 - $50</option>
                    <option value="50-200">$50 - $200</option>
                    <option value="200-1000">$200 - $1000</option>
                    <option value="1000+">$1000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-workspace-text mb-2">Sort By</label>
                  <select
                    value={marketplaceFilters.sort}
                    onChange={(e) => setMarketplaceFilters({ ...marketplaceFilters, sort: e.target.value })}
                    className="w-full px-4 py-2 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
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
                <div className="col-span-full workspace-card px-4 py-8 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-workspace-muted text-lg mb-2">No assets listed yet</p>
                  <p className="text-workspace-muted text-sm">Check back later for new listings!</p>
                </div>
              ) : (
                marketplaceAssets.map((asset, index) => (
                  <div
                    key={index}
                    onClick={() => handleViewAsset(asset)}
                    className="workspace-card overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    {/* Asset Thumbnail */}
                    <div className="h-48 bg-gradient-to-br from-workspace-highlight to-workspace-hover flex items-center justify-center">
                      <div className="text-6xl">{getFileIcon(asset.fileType)}</div>
                    </div>

                    {/* Asset Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-workspace-text mb-2 truncate">{asset.fileName}</h3>
                      <p className="text-sm text-workspace-muted mb-3">by {asset.creator}</p>

                      <div className="flex items-center justify-between mb-3">
                        {asset.salePrice > 0 && (
                          <div className="text-2xl font-bold text-workspace-accent">${asset.salePrice}</div>
                        )}
                        {asset.allowLease && (
                          <span className="bg-violet-900/60 text-violet-200 text-xs px-2 py-1 rounded-full font-semibold">
                            Lease Available
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-workspace-muted">
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
            <div className="workspace-card p-8 mb-6 text-center">
              <input
                type="file"
                ref={profilePhotoInputRef}
                onChange={handleProfilePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => profilePhotoInputRef.current?.click()}
                className="w-32 h-32 mx-auto mb-4 rounded-full bg-workspace-field flex items-center justify-center text-6xl cursor-pointer hover:opacity-80 transition-all overflow-hidden"
                style={{
                  backgroundImage: profileData.profilePhoto.startsWith('data:') ? `url(${profileData.profilePhoto})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!profileData.profilePhoto.startsWith('data:') && profileData.profilePhoto}
              </div>
              <h1 className="text-3xl font-bold text-workspace-text mb-2">{profileData.fullName}</h1>
              <div className="inline-block bg-workspace-highlight text-workspace-accent px-4 py-1 rounded-full font-semibold text-sm mb-2">
                {profileData.accountType === 'pro' ? '🌟 Pro Account' : '🆓 Free Account'}
              </div>
              <p className="text-workspace-muted text-sm">Member since: {profileData.memberSince}</p>
            </div>

            {/* Personal Information */}
            <div className="workspace-card p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-workspace-text">Personal Information</h2>
                <div className="flex gap-2">
                  {profileEditMode && (
                    <button
                      onClick={handleProfileCancel}
                      className="px-4 py-2 border-2 border-workspace-border text-workspace-muted rounded-lg hover:bg-workspace-field transition-all font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleProfileEdit}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      profileEditMode
                        ? 'workspace-action '
                        : 'border-2 border-workspace-accent text-workspace-accent hover:bg-workspace-highlight'
                    }`}
                  >
                    {profileEditMode ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!profileEditMode}
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!profileEditMode}
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!profileEditMode}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="workspace-card p-8 mb-6">
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.businessEnabled}
                    onChange={(e) => setProfileData(prev => ({ ...prev, businessEnabled: e.target.checked }))}
                    disabled={!profileEditMode}
                    className="w-5 h-5 text-workspace-accent rounded focus:ring-workspace-accent disabled:opacity-50"
                  />
                  <span className="ml-2 text-lg font-semibold text-workspace-text">I'm using BloomShield for business</span>
                </label>
              </div>
              {profileData.businessEnabled && (
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <label className="block text-sm text-workspace-muted mb-1">Business Name</label>
                    <input
                      type="text"
                      value={profileData.businessName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                      disabled={!profileEditMode}
                      className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-workspace-muted mb-1">Company Website</label>
                    <input
                      type="url"
                      value={profileData.companyWebsite}
                      onChange={(e) => setProfileData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                      disabled={!profileEditMode}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-workspace-muted mb-1">Industry</label>
                    <select
                      value={profileData.industry}
                      onChange={(e) => setProfileData(prev => ({ ...prev, industry: e.target.value }))}
                      disabled={!profileEditMode}
                      className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
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
                    <label className="block text-sm text-workspace-muted mb-1">Tax ID/EIN (optional)</label>
                    <input
                      type="text"
                      value={profileData.taxId}
                      onChange={(e) => setProfileData(prev => ({ ...prev, taxId: e.target.value }))}
                      disabled={!profileEditMode}
                      className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="workspace-card p-8 mb-6">
              <h2 className="text-2xl font-bold text-workspace-text mb-6">Social Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Portfolio/Website</label>
                  <input
                    type="url"
                    value={profileData.portfolioWebsite}
                    onChange={(e) => setProfileData(prev => ({ ...prev, portfolioWebsite: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Instagram</label>
                  <input
                    type="text"
                    value={profileData.instagram}
                    onChange={(e) => setProfileData(prev => ({ ...prev, instagram: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="@username"
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Twitter/X</label>
                  <input
                    type="text"
                    value={profileData.twitter}
                    onChange={(e) => setProfileData(prev => ({ ...prev, twitter: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="@username"
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                    disabled={!profileEditMode}
                    placeholder="linkedin.com/in/username"
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm text-workspace-muted mb-1">Other</label>
                  <input
                    type="text"
                    value={profileData.other}
                    onChange={(e) => setProfileData(prev => ({ ...prev, other: e.target.value }))}
                    disabled={!profileEditMode}
                    className="w-full px-4 py-2 border-2 border-workspace-border rounded-lg focus:border-workspace-accent focus:outline-none disabled:bg-workspace-field disabled:text-workspace-muted"
                  />
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="workspace-card p-8 mb-6">
              <h2 className="text-2xl font-bold text-workspace-text mb-6">Account Settings</h2>
              <div className="space-y-2">
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-4 py-3 hover:bg-workspace-field rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-workspace-text group-hover:text-workspace-accent">→ Change Password</span>
                </button>
                <button
                  onClick={() => handleAccountAction('2fa')}
                  className="w-full text-left px-4 py-3 hover:bg-workspace-field rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-workspace-text group-hover:text-workspace-accent">→ Two-Factor Authentication</span>
                </button>
                <button
                  onClick={() => handleAccountAction('notifications')}
                  className="w-full text-left px-4 py-3 hover:bg-workspace-field rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-workspace-text group-hover:text-workspace-accent">→ Email Notifications</span>
                </button>
                <button
                  onClick={() => handleAccountAction('privacy')}
                  className="w-full text-left px-4 py-3 hover:bg-workspace-field rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-workspace-text group-hover:text-workspace-accent">→ Privacy Settings</span>
                </button>
                <button
                  onClick={() => handleAccountAction('download')}
                  className="w-full text-left px-4 py-3 hover:bg-workspace-field rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-workspace-text group-hover:text-workspace-accent">→ Download My Data</span>
                </button>
                <button
                  onClick={() => handleAccountAction('delete')}
                  className="w-full text-left px-4 py-3 hover:bg-workspace-field rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="text-red-300 group-hover:text-red-200">→ Delete Account</span>
                </button>
              </div>
            </div>

            <div className="workspace-card p-6">
              <h2 className="mb-3 text-xl font-bold">Workspace plan</h2>
              <button className="workspace-action rounded-lg px-4 py-2" onClick={handleUpgradeToPro}>View billing and usage</button>
            </div>
          </div>
        )}

        {/* SETTINGS PAGE */}
        {currentPage === 'settings' && (
          <section>
            <div className="workspace-tabs">
              <nav aria-label="Settings sections">
                <button
                  onClick={() => setSettingsSection('account')}
                  aria-current={settingsSection === 'account' ? 'true' : undefined}
                >
                  Account
                </button>
                <button
                  onClick={() => setSettingsSection('wallet')}
                  aria-current={settingsSection === 'wallet' ? 'true' : undefined}
                >
                  Ownership Wallet
                </button>
                <button
                  onClick={() => setSettingsSection('security')}
                  aria-current={settingsSection === 'security' ? 'true' : undefined}
                >
                  Security
                </button>
                <button
                  onClick={() => setSettingsSection('privacy')}
                  aria-current={settingsSection === 'privacy' ? 'true' : undefined}
                >
                  Privacy
                </button>
                <button
                  onClick={() => setSettingsSection('notifications')}
                  aria-current={settingsSection === 'notifications' ? 'true' : undefined}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setSettingsSection('billing')}
                  aria-current={settingsSection === 'billing' ? 'true' : undefined}
                >
                  Billing
                </button>
                <button
                  onClick={() => setSettingsSection('data')}
                  aria-current={settingsSection === 'data' ? 'true' : undefined}
                >
                  Data & Export
                </button>
                <button
                  onClick={() => setSettingsSection('advanced')}
                  aria-current={settingsSection === 'advanced' ? 'true' : undefined}
                >
                  Advanced
                </button>
              </nav>
            </div>

            {/* Settings Main Content */}
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
              {/* ACCOUNT SECTION */}
              {settingsSection === 'account' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-8">Account Settings</h1>
                  <div className="workspace-card p-6 mb-6">
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">Profile Information</h3>
                    <p className="text-workspace-muted">Manage your account details and preferences.</p>
                    <button
                      onClick={() => setCurrentPage('profile')}
                      className="mt-4 workspace-action px-6 py-2 rounded-lg  transition-all"
                    >
                      Go to Profile →
                    </button>
                  </div>
                </div>
              )}

              {/* OWNERSHIP WALLET SECTION */}
              {settingsSection === 'wallet' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">Ownership Wallet</h1>
                  <p className="text-workspace-muted mb-8">Inspect the timestamp records for your digital assets</p>

                  <div className="workspace-card p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-3">Blockchain records</h3>
                    <p className="text-sm text-workspace-muted">BloomShield submits timestamps through its service wallet. Your account does not include a personal cryptocurrency wallet or recovery phrase. Use each asset’s verified transaction link to inspect its timestamp.</p>
                  </div>

                  {/* Protected Assets Card */}
                  <div className="workspace-card p-6">
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">Protected Assets</h3>
                    {protectedFiles.length === 0 ? (
                      <p className="text-workspace-muted">No protected assets yet</p>
                    ) : (
                      <div className="space-y-3">
                        {protectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="bg-workspace-field p-4 rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-workspace-text">{file.fileName}</p>
                              <p className="text-workspace-muted text-sm font-mono">{file.assetId}</p>
                            </div>
                            <span className="text-emerald-300 text-sm font-semibold">● Protected</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blockchain Info */}
                  <div className="bg-emerald-950/60 border-l-4 border-green-500 p-6 rounded-lg mt-6">
                    <h4 className="font-semibold text-workspace-text mb-2">✓ Permanent Protection</h4>
                    <p className="text-workspace-text text-sm">
                      Your ownership records exist on the blockchain forever, completely independent of BloomShield.
                      Even if our service disappears, your proof of ownership remains permanent and verifiable.
                    </p>
                  </div>
                </div>
              )}

              {/* SECURITY SECTION */}
              {settingsSection === 'security' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">Security</h1>
                  <p className="text-workspace-muted mb-8">Manage your account security and authentication</p>

                  <SecuritySettings email={currentUser?.email ?? ''} />
                </div>
              )}

              {/* PRIVACY SECTION */}
              {settingsSection === 'privacy' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">Privacy</h1>
                  <p className="text-workspace-muted mb-8">Control who can see your profile and content</p>

                  {/* Profile Visibility Card */}
                  <div className="workspace-card p-6 mb-6">
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">Profile Visibility</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-workspace-text">Public Profile</p>
                          <p className="text-sm text-workspace-muted">Allow others to view your profile</p>
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
                          <span className="absolute cursor-pointer inset-0 bg-workspace-hover rounded-full transition-all peer-checked:bg-[#FF8C42] peer-focus:ring-2 peer-focus:ring-[#FF8C42]/50"></span>
                          <span className="absolute left-1 top-1 w-4 h-4 bg-workspace-panel rounded-full transition-all peer-checked:translate-x-6"></span>
                        </label>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-workspace-text">Show in Search Results</p>
                          <p className="text-sm text-workspace-muted">Allow your profile to appear in searches</p>
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
                          <span className="absolute cursor-pointer inset-0 bg-workspace-hover rounded-full transition-all peer-checked:bg-[#FF8C42] peer-focus:ring-2 peer-focus:ring-[#FF8C42]/50"></span>
                          <span className="absolute left-1 top-1 w-4 h-4 bg-workspace-panel rounded-full transition-all peer-checked:translate-x-6"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS SECTION */}
              {settingsSection === 'notifications' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">Notifications</h1>
                  <p className="text-workspace-muted mb-8">Manage your notification preferences</p>

                  {/* Email Notifications Card */}
                  <div className="workspace-card p-6 mb-6">
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">Email Notifications</h3>
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
                            <p className="font-semibold text-workspace-text">{label}</p>
                            <p className="text-sm text-workspace-muted">{desc}</p>
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
                            <span className="absolute cursor-pointer inset-0 bg-workspace-hover rounded-full transition-all peer-checked:bg-[#FF8C42] peer-focus:ring-2 peer-focus:ring-[#FF8C42]/50"></span>
                            <span className="absolute left-1 top-1 w-4 h-4 bg-workspace-panel rounded-full transition-all peer-checked:translate-x-6"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING SECTION */}
              {settingsSection === 'billing' && <BillingPlans />}

              {/* DATA & EXPORT SECTION */}
              {settingsSection === 'data' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">Data & Export</h1>
                  <p className="text-workspace-muted mb-8">Download your data and manage account information</p>

                  {/* Data Export Card */}
                  <div className="workspace-card p-6">
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">Export Your Data</h3>
                    <p className="text-workspace-muted mb-6">Download a copy of all your BloomShield data</p>
                    <button
                      onClick={() => {
                        const exportData = {
                          profile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
                          wallet: JSON.parse(localStorage.getItem('userWallet') || '{}'),
                          files: JSON.parse(localStorage.getItem('protectedFiles') || '[]'),
                          settings: {
                            twoFactorEnabled,
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
                      className="workspace-action px-6 py-3 rounded-lg  transition-all font-semibold"
                    >
                      📥 Download My Data
                    </button>
                  </div>
                </div>
              )}

              {/* ADVANCED SECTION */}
              {settingsSection === 'advanced' && (
                <div>
                  <h1 className="text-2xl font-bold text-workspace-text mb-4">Advanced Settings</h1>
                  <p className="text-workspace-muted mb-8">API access and account management</p>

                  {/* API Keys Card */}
                  <div className="workspace-card p-6 mb-6">
                    <h3 className="text-xl font-semibold text-workspace-text mb-4">API Keys</h3>
                    <p className="text-workspace-muted mb-4">Manage API keys for programmatic access</p>

                    {apiKeys.length === 0 ? (
                      <p className="text-workspace-muted text-sm mb-4">No API keys yet</p>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="bg-workspace-field p-4 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-workspace-text">{key.name}</p>
                              <p className="text-sm text-workspace-muted">Created: {key.created}</p>
                              <code className="text-xs font-mono text-workspace-muted">{key.key.substring(0, 20)}...</code>
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
                              className="bg-red-950/60 text-red-300 px-4 py-2 rounded-lg hover:bg-red-900/60 transition-all text-sm"
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
                      className="workspace-action px-6 py-2 rounded-lg  transition-all"
                    >
                      + Generate New API Key
                    </button>
                  </div>

                  {/* Danger Zone Card */}
                  <div className="workspace-card border-2 border-red-800 p-6">
                    <h3 className="text-xl font-semibold text-red-300 mb-4">⚠️ Danger Zone</h3>

                    <div className="bg-emerald-950/60 border-l-4 border-green-500 p-4 rounded-lg mb-6">
                      <p className="text-sm font-semibold text-workspace-text mb-1">✓ Important: Blockchain Protection</p>
                      <p className="text-xs text-workspace-text">
                        Deleting your BloomShield account will NOT delete your blockchain records.
                        Your ownership proofs remain permanent and verifiable forever through your wallet address.
                      </p>
                    </div>

                    <p className="text-workspace-text mb-4">
                      This permanently deletes your account, file records, and private files owned by this account. Blockchain timestamps and previously published IPFS metadata remain.
                      This action cannot be undone.
                    </p>
                    <button
                      onClick={async () => {
                        if (prompt('Type DELETE to permanently remove your account and the files it owns.') !== 'DELETE') return;
                        try {
                          const response = await fetch('/api/account/delete', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ confirm: 'DELETE' }),
                          });
                          if (!response.ok) throw new Error((await response.json()).error);
                          await getSupabaseBrowserClient().auth.signOut({ scope: 'local' });
                          window.location.replace('/');
                        } catch (error) {
                          showToastMessage(error instanceof Error ? error.message : 'Account deletion failed.', 'error');
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
          </section>
        )}
        </main>
      </div>

      {/* Processing Overlay */}
      <ProcessingOverlay
        show={showProcessing}
        currentStep={processingStep}
      />

      {/* Auth Modal (Login/Signup/Reset) */}
      <AuthModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignUpSuccess={handleSignUpSuccess}
      />

      {/* Seed Phrase Modal - Shows on first login */}
      {showSeedPhraseModal && userWallet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
          <div className="bg-workspace-panel rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowSeedPhraseModal(false);
                setSeedPhraseAcknowledged(false);
              }}
              className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-workspace-field transition-all"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔑</div>
              <h2 className="text-3xl font-bold text-workspace-text mb-2">Your Ownership Wallet Created</h2>
              <p className="text-workspace-muted">This is your permanent proof of ownership</p>
            </div>

            <div className="bg-workspace-highlight border-2 border-workspace-accent p-4 rounded-lg mb-6">
              <p className="text-workspace-accent font-semibold mb-2">⚠️ CRITICAL: Save This Recovery Phrase</p>
              <p className="text-workspace-text text-sm">
                This is the ONLY way to prove ownership if BloomShield ever shuts down. We cannot recover it for you.
              </p>
            </div>

            <div className="bg-workspace-field p-6 rounded-lg mb-6">
              <p className="text-workspace-muted text-sm mb-4">Your 12-word recovery phrase:</p>
              <div className="bg-workspace-panel p-4 rounded-lg mb-4">
                <code className="font-mono text-base text-workspace-text break-words leading-loose">
                  {userWallet.seedPhrase}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userWallet.seedPhrase);
                  showToastMessage('📋 Recovery phrase copied!', 'success');
                }}
                className="w-full bg-workspace-panel border-2 border-workspace-accent text-workspace-accent py-3 rounded-lg font-semibold hover:bg-workspace-highlight transition-all"
              >
                📋 Copy to Clipboard
              </button>
            </div>

            <div className="bg-emerald-950/60 border-l-4 border-green-500 p-4 rounded-lg mb-6">
              <p className="font-semibold text-workspace-text mb-2">✓ Why This Matters:</p>
              <p className="text-workspace-text text-sm">
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
                  className="w-5 h-5 mr-3 cursor-pointer accent-workspace-accent"
                />
                <span className="text-workspace-text">I have written down my recovery phrase in a safe place</span>
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
                ? 'w-full workspace-action py-4 rounded-lg font-bold text-lg cursor-pointer  transition-all'
                : 'w-full bg-workspace-hover text-white py-4 rounded-lg font-bold text-lg cursor-not-allowed'}
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

      {/* Listing Modal */}
      {showListingModal && assetToList && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
          <div className="bg-workspace-panel rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowListingModal(false);
                setAssetToList(null);
              }}
              className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text text-2xl"
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-workspace-text mb-2">List {assetToList.fileName} on Marketplace</h2>
            <p className="text-workspace-muted mb-6">Set your pricing and license terms</p>

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
                <label className="block text-sm font-semibold text-workspace-text mb-2">Listing Type:</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      value="sale"
                      defaultChecked
                      className="w-4 h-4 mr-2 accent-workspace-accent"
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
                      className="w-4 h-4 mr-2 accent-workspace-accent"
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
                      className="w-4 h-4 mr-2 accent-workspace-accent"
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
                <label className="block text-sm font-semibold text-workspace-text mb-2">Sale Price (USD):</label>
                <input
                  type="number"
                  name="salePrice"
                  min="1"
                  step="0.01"
                  placeholder="500"
                  className="w-full px-4 py-3 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                  required
                />
              </div>

              {/* Lease Pricing */}
              <div id="leaseSection" className="mb-6" style={{ display: 'none' }}>
                <label className="block text-sm font-semibold text-workspace-text mb-2">Lease Pricing:</label>
                <div className="space-y-3">
                  <input
                    type="number"
                    name="lease1Month"
                    min="1"
                    step="0.01"
                    placeholder="1 Month Price ($50)"
                    className="w-full px-4 py-3 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                  />
                  <input
                    type="number"
                    name="lease6Month"
                    min="1"
                    step="0.01"
                    placeholder="6 Months Price ($250)"
                    className="w-full px-4 py-3 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                  />
                  <input
                    type="number"
                    name="lease1Year"
                    min="1"
                    step="0.01"
                    placeholder="1 Year Price ($400)"
                    className="w-full px-4 py-3 border border-workspace-border rounded-lg focus:outline-none focus:ring-2 focus:ring-workspace-accent"
                  />
                </div>
              </div>

              {/* License Terms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-workspace-text mb-2">License Terms:</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="commercialUse"
                      defaultChecked
                      className="w-4 h-4 mr-2 accent-workspace-accent"
                    />
                    <span>Commercial use allowed</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="attribution"
                      defaultChecked
                      className="w-4 h-4 mr-2 accent-workspace-accent"
                    />
                    <span>Attribution required</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full workspace-action py-4 rounded-lg font-bold text-lg  transition-all"
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
          <div className="bg-workspace-panel rounded-2xl p-8 max-w-4xl w-full shadow-2xl relative my-8">
            {/* Close button */}
            <button
              onClick={() => {
                setShowAssetDetail(false);
                setSelectedAsset(null);
              }}
              className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text text-2xl"
            >
              ×
            </button>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Preview */}
              <div>
                <div className="bg-gradient-to-br from-workspace-highlight to-workspace-hover rounded-xl h-64 flex items-center justify-center mb-4">
                  <div className="text-8xl">{getFileIcon(selectedAsset.fileType)}</div>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 p-4 rounded-lg text-center">
                  <p className="font-semibold mb-1">✓ Verified on Polygon Blockchain</p>
                  <button
                    onClick={() => window.open(`https://polygonscan.com/tx/${selectedAsset.blockchainTx}`, '_blank')}
                    className="text-sm underline hover:text-emerald-100"
                  >
                    View Transaction
                  </button>
                </div>
              </div>

              {/* Right: Info & Purchase */}
              <div>
                <h2 className="text-3xl font-bold text-workspace-text mb-2">{selectedAsset.fileName}</h2>
                <p className="text-workspace-muted mb-4">Protected creative asset</p>

                <div className="bg-workspace-field p-4 rounded-lg mb-6 space-y-2 text-sm">
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
                  <div className="bg-workspace-highlight border-2 border-workspace-accent p-6 rounded-xl mb-4">
                    <h3 className="font-bold text-xl text-workspace-text mb-2">Buy Outright</h3>
                    <div className="text-4xl font-bold text-workspace-accent mb-3">${selectedAsset.salePrice}</div>
                    <p className="text-sm text-workspace-muted mb-4">Full ownership transfer. You can use commercially and resell.</p>
                    <button
                      onClick={handlePurchaseAsset}
                      className="w-full workspace-action py-3 rounded-lg font-bold  transition-all"
                    >
                      Buy Now
                    </button>
                  </div>
                )}

                {/* Lease Options */}
                {selectedAsset.allowLease && (
                  <div className="bg-violet-950/60 border-2 border-violet-800 p-6 rounded-xl">
                    <h3 className="font-bold text-xl text-workspace-text mb-3">Lease</h3>
                    <p className="text-sm text-workspace-muted mb-4">Time-limited usage rights</p>

                    <div className="space-y-2">
                      {selectedAsset.leasePrice1Month > 0 && (
                        <button
                          onClick={() => handleLeaseAsset('1 Month', selectedAsset.leasePrice1Month)}
                          className="w-full bg-workspace-panel border-2 border-violet-800 text-violet-200 py-3 rounded-lg font-semibold hover:bg-violet-900/60 transition-all flex justify-between items-center px-4"
                        >
                          <span>1 Month</span>
                          <span className="font-bold">${selectedAsset.leasePrice1Month}</span>
                        </button>
                      )}
                      {selectedAsset.leasePrice6Month > 0 && (
                        <button
                          onClick={() => handleLeaseAsset('6 Months', selectedAsset.leasePrice6Month)}
                          className="w-full bg-workspace-panel border-2 border-violet-800 text-violet-200 py-3 rounded-lg font-semibold hover:bg-violet-900/60 transition-all flex justify-between items-center px-4"
                        >
                          <span>6 Months</span>
                          <span className="font-bold">${selectedAsset.leasePrice6Month}</span>
                        </button>
                      )}
                      {selectedAsset.leasePrice1Year > 0 && (
                        <button
                          onClick={() => handleLeaseAsset('1 Year', selectedAsset.leasePrice1Year)}
                          className="w-full bg-workspace-panel border-2 border-violet-800 text-violet-200 py-3 rounded-lg font-semibold hover:bg-violet-900/60 transition-all flex justify-between items-center px-4"
                        >
                          <span>1 Year</span>
                          <span className="font-bold">${selectedAsset.leasePrice1Year}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* License Terms */}
                <div className="mt-6 bg-workspace-field p-4 rounded-lg">
                  <h4 className="font-semibold text-workspace-text mb-2">License Terms</h4>
                  <ul className="text-sm text-workspace-muted space-y-1">
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
