'use client';

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);
  
  console.log('🔍 COMPONENT RENDERING - Count:', count);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            🌼 BloomShield - Component Test VERSION 2
          </h1>
          
          <div className="text-center space-y-4">
            <p className="text-xl">Count: {count}</p>
            
            <button
              onClick={() => {
                console.log('🔍 BUTTON CLICKED');
                setCount(count + 1);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Click Me to Test React
            </button>
            
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ If you can see this and the button works, React is rendering!
              </p>
              <p className="text-sm text-green-700 mt-2">
                🔍 Check browser console for logs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
