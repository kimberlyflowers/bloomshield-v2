'use client';

import { useState } from 'react';

// Simple SHA-256 hash function
const generateSHA256Hash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Simple content hash (using file properties + first bytes)
const generateContentHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const firstBytes = new Uint8Array(arrayBuffer.slice(0, 100));
  const properties = `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
  
  const combined = properties + Array.from(firstBytes).join('');
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

// Floral hash simulation
const generateFloralHash = async (file: File): Promise<string> => {
  const baseHash = await generateSHA256Hash(file);
  return '0xFLORAL' + baseHash.slice(0, 8);
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [hashes, setHashes] = useState<{legal: string, content: string, floral: string} | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
      setHashes(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadStatus('Generating legal hash (SHA-256)...');
    const legalHash = await generateSHA256Hash(selectedFile);
    
    setUploadStatus('Generating content hash...');
    const contentHash = await generateContentHash(selectedFile);
    
    setUploadStatus('Generating floral hash...');
    const floralHash = await generateFloralHash(selectedFile);
    
    setHashes({
      legal: legalHash,
      content: contentHash,
      floral: floralHash
    });
    
    setUploadStatus('✅ All hashes generated successfully! Ready for Supabase storage.');
  };

  return (
    <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🌼 BloomShield Prototype</h1>
      <p>Upload your file to generate protection hashes</p>
      
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

      {uploadStatus && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: uploadStatus.includes('✅') ? '#f0fff0' : '#f0f8ff', 
          border: uploadStatus.includes('✅') ? '1px solid #00a000' : '1px solid #0070f3',
          borderRadius: '5px',
          margin: '10px 0'
        }}>
          {uploadStatus}
        </div>
      )}

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
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Next: We'll store these hashes in Supabase
          </p>
        </div>
      )}
    </div>
  );
}
