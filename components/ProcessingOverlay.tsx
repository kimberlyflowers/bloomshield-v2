'use client';

import { useEffect, useState } from 'react';

interface ProcessingStep {
  icon: string;
  text: string;
  status: 'pending' | 'active' | 'complete';
}

interface ProcessingOverlayProps {
  show: boolean;
  currentStep: number;
  onComplete?: () => void;
}

export default function ProcessingOverlay({ show, currentStep, onComplete }: ProcessingOverlayProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { icon: '📄', text: 'Analyzing file', status: 'pending' },
    { icon: '🌸', text: 'Generating Asset ID', status: 'pending' },
    { icon: '⏰', text: 'Creating timestamp', status: 'pending' },
    { icon: '✓', text: 'Finalizing protection', status: 'pending' },
  ]);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step, index) => {
        if (index < currentStep - 1) {
          return { ...step, status: 'complete' };
        } else if (index === currentStep - 1) {
          return { ...step, status: 'active' };
        } else {
          return { ...step, status: 'pending' };
        }
      })
    );

    if (currentStep > 4) {
      setShowSuccess(true);
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }
  }, [currentStep, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[2000] animate-fadeIn">
      <div className="bg-white w-[90%] max-w-[600px] rounded-3xl p-12 text-center shadow-2xl animate-slideUp">
        <div className="text-6xl mb-6 animate-pulse">🛡️</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Protecting Your Work</h2>
        <p className="text-gray-600 mb-10">Please wait while we secure your file...</p>

        <div className="space-y-2 mb-8 text-left">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center p-4 rounded-lg transition-all ${
                step.status === 'active'
                  ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-l-4 border-[#FF8C42]'
                  : step.status === 'complete'
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500'
                  : 'bg-gray-50'
              }`}
            >
              <div className="text-2xl mr-4 w-8 text-center">{step.icon}</div>
              <div className="flex-1 font-medium text-gray-800">{step.text}</div>
              <div className="text-xl">
                {step.status === 'complete' ? (
                  '✓'
                ) : step.status === 'active' ? (
                  <span className="animate-spin inline-block">⟳</span>
                ) : (
                  '⏳'
                )}
              </div>
            </div>
          ))}
        </div>

        {showSuccess && (
          <div
            className="p-8 rounded-xl animate-slideUp"
            style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
            }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <div className="text-xl font-bold text-green-800">Your work is now protected!</div>
          </div>
        )}
      </div>
    </div>
  );
}
