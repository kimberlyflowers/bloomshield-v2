'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [legalHash, setLegalHash] = useState<string>('');
  const [contentHash, setContentHash] = useState<string>('');
  const [floralHash, setFloralHash] = useState<string>('');
  const [blockchainTx, setBlockchainTx] = useState<string>('');
  const [recordId, setRecordId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase client
  const getSupabaseClient = () => {
    if (typeof window === 'undefined') return null;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not set');
      return null;
    }
    
    try {
      const { createClient } = require('@supabase/supabase-js');
      return createClient(supabaseUrl, supabaseKey);
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  };

  // Generate all 3 hashes
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

      // Floral Hash (Visual)
      const floral = '0xFLORAL' + legal.substring(0, 10);

      return { legal, content, floral };
    } catch (error) {
      console.error('Hash generation failed:', error);
      throw new Error('Failed to generate file hashes');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      // Step 1: Generate Hashes
      setUploadStatus('Generating protection hashes...');
      const hashes = await generateHashes(selectedFile);
      setLegalHash(hashes.legal);
      setContentHash(hashes.content);
      setFloralHash(hashes.floral);

      // Step 2: Blockchain Timestamp
      setUploadStatus('⛓️ Creating blockchain timestamp...');
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

      // Step 3: Upload to Supabase Storage
      setUploadStatus('Uploading to secure storage...');
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
      
      const successMessage = blockchainTransactionHash.startsWith('0xSIM') 
        ? '✅ File protected successfully! ⚠️ Using simulated blockchain.'
        : '✅ File protected and stored successfully! ⛓️ Blockchain timestamp created!';
      
      setUploadStatus(successMessage);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            🌼 BloomShield Prototype
          </h1>
          <p className="text-center text-gray-600 mb-8">Upload your file to generate protection hashes</p>

          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                📎 Choose File
              </button>
              {selectedFile && (
                <p className="mt-4 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Generate Protection Hashes
            </button>

            {/* Upload Status */}
            {uploadStatus && (
              <div className={`p-4 rounded-lg ${
                uploadStatus.includes('Error') ? 'bg-red-50 text-red-700' : 
                uploadStatus.includes('⛓️') ? 'bg-green-50 text-green-700' : 
                'bg-blue-50 text-blue-700'
              }`}>
                {uploadStatus}
              </div>
            )}

            {/* Triple Hash Display */}
            {legalHash && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-800 mb-4">✅ Your File is Protected!</h2>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Legal Hash (SHA-256):</span>
                    <div className="font-mono bg-white p-3 rounded mt-1 text-xs overflow-x-auto whitespace-nowrap border break-all">
                      {legalHash}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Content Hash (Perceptual):</span>
                    <div className="font-mono bg-white p-3 rounded mt-1 text-xs overflow-x-auto whitespace-nowrap border break-all">
                      {contentHash}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Floral Hash (Visual):</span>
                    <div className="font-mono bg-white p-3 rounded mt-1 text-xs overflow-x-auto whitespace-nowrap border break-all">
                      {floralHash}
                    </div>
                  </div>

                  {blockchainTx && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        {blockchainTx.startsWith('0xSIM') ? '⚠️ Simulated Blockchain TX:' : '⛓️ Blockchain TX:'}
                      </span>
                      <div className="font-mono bg-white p-3 rounded mt-1 text-xs overflow-x-auto whitespace-nowrap border break-all">
                        {blockchainTx}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Transaction ID: {blockchainTx.length} characters
                      </p>
                    </div>
                  )}

                  {recordId && (
                    <p className="text-center pt-4 border-t border-green-300">
                      📁 Stored in Supabase: Record #{recordId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
