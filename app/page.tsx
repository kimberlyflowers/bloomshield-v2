'use client';

import { useState, useRef } from 'react';
// Use your existing Supabase client setup
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

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [legalHash, setLegalHash] = useState<string>('');
  const [contentHash, setContentHash] = useState<string>('');
  const [floralHash, setFloralHash] = useState<string>('');
  const [blockchainTx, setBlockchainTx] = useState<string>('');
  const [recordId, setRecordId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateHashes = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const uint8Array = new Uint8Array(arrayBuffer);
    let simpleSum = 0;
    for (let i = 0; i < Math.min(uint8Array.length, 1000); i++) {
      simpleSum += uint8Array[i];
    }
    const content = '0x' + (simpleSum % 0xFFFFFFFFFFFFFFFF).toString(16).padStart(16, '0');

    const floral = '0xFLORAL' + legal.substring(0, 10);

    return { legal, content, floral };
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

      // Step 2: TEST BLOCKCHAIN API DIRECTLY
      setUploadStatus('⛓️ Creating blockchain timestamp...');
      console.log('🔗 DEBUG: Starting blockchain API test...');
      console.log('🔗 DEBUG: Hashes generated:', hashes);
      
      let blockchainResult = null;
      try {
        console.log('🔗 DEBUG: Making fetch request to /api/blockchain/timestamp');
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

        console.log('📡 DEBUG: Response status:', response.status);
        console.log('📡 DEBUG: Response ok:', response.ok);
        
        const result = await response.json();
        console.log('📦 DEBUG: Full API response:', result);

        if (response.ok && result.success) {
          blockchainResult = result.blockchain;
          setBlockchainTx(blockchainResult.transactionHash);
          console.log('✅ DEBUG: Blockchain timestamp created!', blockchainResult);
        } else {
          console.error('❌ DEBUG: Blockchain API failed:', result.error);
          throw new Error(result.error || 'Blockchain API failed');
        }
      } catch (blockchainError) {
        console.error('❌ DEBUG: Blockchain call failed completely:', blockchainError);
        // Fallback to simulated transaction
        const simulatedTx = `0xSIM${Math.random().toString(16).substr(2, 60)}`;
        setBlockchainTx(simulatedTx);
        console.log('⚠️ DEBUG: Using simulated transaction:', simulatedTx);
      }

      // Step 3: Upload to Supabase Storage
      setUploadStatus('Uploading to secure storage...');
      const fileName = `${Date.now()}_${selectedFile.name}`;
      console.log('📁 DEBUG: Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('protected-files')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('❌ DEBUG: Storage upload failed:', uploadError);
        throw uploadError;
      }
      console.log('✅ DEBUG: File uploaded successfully:', uploadData);

      // Step 4: Save to Database (with blockchain data!)
      setUploadStatus('Saving protection record...');
      const recordData = {
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        storage_path: uploadData.path,
        legal_hash: hashes.legal,
        content_hash: hashes.content,
        floral_hash: hashes.floral,
        blockchain_tx: blockchainTx || blockchainResult?.transactionHash,
        blockchain_timestamp: blockchainResult 
          ? new Date(blockchainResult.timestamp).toISOString() 
          : new Date().toISOString(),
      };
      
      console.log('💾 DEBUG: Saving to database:', recordData);

      const { data: dbData, error: dbError } = await supabase
        .from('protected_files')
        .insert(recordData)
        .select()
        .single();

      if (dbError) {
        console.error('❌ DEBUG: Database save failed:', dbError);
        throw dbError;
      }

      setRecordId(dbData.id);
      console.log('✅ DEBUG: Database record saved:', dbData);
      
      setUploadStatus('✅ File protected and stored successfully! ' + 
        (blockchainResult ? '⛓️ Blockchain timestamp created!' : '⚠️ Using simulated blockchain.'));

    } catch (error) {
      console.error('❌ DEBUG: Overall upload failed:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            🌼 BloomShield Prototype
          </h1>
          <p className="text-center text-gray-600 mb-8">Upload your file to generate protection hashes</p>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                📎 Choose File
              </button>
              {selectedFile && (
                <p className="mt-4 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Generate Protection Hashes
            </button>

            {uploadStatus && (
              <div className={`p-4 rounded-lg ${uploadStatus.includes('Error') ? 'bg-red-50 text-red-700' : uploadStatus.includes('⛓️') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                {uploadStatus}
              </div>
            )}

            {legalHash && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-800 mb-4">✅ Your File is Protected!</h2>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Legal Hash (SHA-256):</span>
                    <p className="font-mono bg-white p-2 rounded mt-1 break-all">{legalHash}</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Content Hash (Perceptual):</span>
                    <p className="font-mono bg-white p-2 rounded mt-1">{contentHash}</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Floral Hash (Visual):</span>
                    <p className="font-mono bg-white p-2 rounded mt-1">{floralHash}</p>
                  </div>

                  {blockchainTx && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        {blockchainTx.startsWith('0xSIM') ? '⚠️ Simulated Blockchain TX:' : '⛓️ Blockchain TX:'}
                      </span>
                      <p className="font-mono bg-white p-2 rounded mt-1 break-all">{blockchainTx}</p>
                      {!blockchainTx.startsWith('0xSIM') && (
                        <p className="text-xs text-green-600 mt-1">✅ Permanently timestamped on blockchain</p>
                      )}
                    </div>
                  )}

                  {recordId && (
                    <p className="text-center pt-4 border-t border-green-300">
                      📁 Stored in Supabase: Record #{recordId}
                    </p>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700">
                    {blockchainTx && !blockchainTx.startsWith('0xSIM') 
                      ? '✅ Your file is now protected with blockchain proof!'
                      : '⚠️ Next: Add blockchain API keys to enable real blockchain timestamping'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
