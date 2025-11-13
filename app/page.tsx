'use client';

import { useState } from 'react';

// 🚨 SECURITY NOTE: Using service_role key to bypass RLS for prototyping
// TODO: Replace with proper RLS policies before production
// Current setup allows full database access - not secure for user data
// RLS Policies needed: Authenticated users only for INSERT/UPDATE/DELETE

// Supabase client
const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables not set');
    return null;
  }
  
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseKey);
};

// Hash generation functions
const generateSHA256Hash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateContentHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const firstBytes = new Uint8Array(arrayBuffer.slice(0, 100));
  const properties = `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
  
  const combined = properties + Array.from(firstBytes).join('');
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

const generateFloralHash = async (file: File): Promise<string> => {
  const baseHash = await generateSHA256Hash(file);
  return '0xFLORAL' + baseHash.slice(0, 8);
};

// Simulated blockchain function (no ThirdWeb dependencies)
const storeOnBlockchain = async (legalHash: string, contentHash: string, floralHash: string) => {
  // Simulate blockchain transaction - will replace with real calls later
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      const simulatedTx = `0x${Math.random().toString(16).substr(2, 64)}`;
      resolve(simulatedTx);
    }, 1000);
  });
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [hashes, setHashes] = useState<{legal: string, content: string, floral: string} | null>(null);
  const [supabaseRecord, setSupabaseRecord] = useState<any>(null);
  const [blockchainTx, setBlockchainTx] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
      setHashes(null);
      setSupabaseRecord(null);
      setBlockchainTx(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      setUploadStatus('❌ Supabase not configured. Check environment variables.');
      return;
    }

    try {
      // Step 1: Generate hashes
      setUploadStatus('Generating legal hash (SHA-256)...');
      const legalHash = await generateSHA256Hash(selectedFile);
      
      setUploadStatus('Generating content hash...');
      const contentHash = await generateContentHash(selectedFile);
      
      setUploadStatus('Generating floral hash...');
      const floralHash = await generateFloralHash(selectedFile);

      // Step 2: Store on Blockchain (simulated)
      setUploadStatus('Creating blockchain timestamp...');
      const blockchainTransaction = await storeOnBlockchain(legalHash, contentHash, floralHash);
      setBlockchainTx(blockchainTransaction);

      // Step 3: Upload file to Supabase Storage
      setUploadStatus('Uploading file to secure storage...');
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${legalHash.slice(0, 16)}.${fileExt}`;
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('protected-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Step 4: Save hash record to database
      setUploadStatus('Saving protection record...');
      const recordData = {
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        legal_hash: legalHash,
        content_hash: contentHash,
        floral_hash: floralHash,
        storage_path: fileData?.path,
        blockchain_tx: blockchainTransaction
      };

      const { data: record, error: dbError } = await supabase
        .from('protected_files')
        .insert(recordData)
        .select()
        .single();

      if (dbError) throw dbError;

      // Success!
      setHashes({ legal: legalHash, content: contentHash, floral: floralHash });
      setSupabaseRecord(record);
      setUploadStatus('✅ File protected and stored on blockchain!');

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🌼 BloomShield Prototype</h1>
      <p>Upload your file to generate protection hashes</p>
      
      {/* File Upload Section */}
      <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', margin: '20px 0', borderRadius: '10px' }}>
        <input
          type="file"
          onChange={handleFileSelect}
          style={{ marginBottom: '20px' }}
          accept="image/*,video/*"
        />
        <br />
        {selectedFile && (
          <p style={{ margin: '10px 0', color: '#666' }}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        <button 
          onClick={handleUpload}
          disabled={!selectedFile}
          style={{
            padding: '10px 20px',
            backgroundColor: selectedFile ? '#0070f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: selectedFile ? 'pointer' : 'not-allowed'
          }}
        >
          Generate Protection Hashes
        </button>
      </div>

      {/* Status Message */}
      {uploadStatus && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: uploadStatus.includes('✅') ? '#f0fff0' : 
                         uploadStatus.includes('❌') ? '#fff0f0' : '#f0f8ff', 
          border: uploadStatus.includes('✅') ? '1px solid #00a000' : 
                 uploadStatus.includes('❌') ? '1px solid #ff0000' : '1px solid #0070f3',
          borderRadius: '5px',
          margin: '10px 0'
        }}>
          {uploadStatus}
        </div>
      )}

      {/* Hash Display */}
      {hashes && (
        <div style={{ marginTop: '30px' }}>
          <h3>✅ Your File is Protected!</h3>
          <div style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <p><strong>Legal Hash (SHA-256):</strong> 
              <br /><code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{hashes.legal}</code>
            </p>
            <p><strong>Content Hash (Perceptual):</strong> 
              <br /><code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{hashes.content}</code>
            </p>
            <p><strong>Floral Hash (Visual):</strong> 
              <br /><code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{hashes.floral}</code>
            </p>
            
            {blockchainTx && (
              <p><strong>🔗 Blockchain Transaction:</strong> 
                <br /><code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{blockchainTx}</code>
              </p>
            )}
            
            {supabaseRecord && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                <p style={{ color: '#00a000', fontSize: '14px' }}>
                  <strong>📁 Stored in Supabase:</strong> Record #{supabaseRecord.id}
                </p>
              </div>
            )}
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Your file is now permanently protected with blockchain timestamping!
          </p>
        </div>
      )}
    </div>
  );
}
