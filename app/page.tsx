'use client';

import { useState } from 'react';

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
    
    setUploadStatus('Generating hashes...');
    
    // Simulate hash generation (we'll implement real hashes next)
    setTimeout(() => {
      setHashes({
        legal: '0x' + Math.random().toString(16).substr(2, 16),
        content: '0x' + Math.random().toString(16).substr(2, 16),
        floral: '0x' + Math.random().toString(16).substr(2, 16)
      });
      setUploadStatus('Hashes generated successfully!');
    }, 2000);
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
          backgroundColor: '#f0f8ff', 
          border: '1px solid #0070f3',
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
            <p><strong>Legal Hash (SHA-256):</strong> {hashes.legal}</p>
            <p><strong>Content Hash (Perceptual):</strong> {hashes.content}</p>
            <p><strong>Floral Hash (Visual):</strong> {hashes.floral}</p>
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Next: We'll store these hashes on the blockchain
          </p>
        </div>
      )}
    </div>
  );
}
