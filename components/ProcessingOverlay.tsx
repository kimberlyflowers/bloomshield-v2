'use client';

const steps = [
  { icon: '📄', text: 'Analyzing file' },
  { icon: '🌸', text: 'Generating asset ID' },
  { icon: '📌', text: 'Storing hash metadata' },
  { icon: '⏰', text: 'Confirming Polygon timestamp' },
  { icon: '🛡️', text: 'Saving private file' },
  { icon: '✓', text: 'Saving protection record' },
];

interface ProcessingOverlayProps {
  show: boolean;
  currentStep: number;
}

export default function ProcessingOverlay({ show, currentStep }: ProcessingOverlayProps) {
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
                index + 1 === currentStep
                  ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-l-4 border-[#FF8C42]'
                  : index + 1 < currentStep
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500'
                  : 'bg-gray-50'
              }`}
            >
              <div className="text-2xl mr-4 w-8 text-center">{step.icon}</div>
              <div className="flex-1 font-medium text-gray-800">{step.text}</div>
              <div className="text-xl">
                {index + 1 < currentStep ? (
                  '✓'
                ) : index + 1 === currentStep ? (
                  <span className="animate-spin inline-block">⟳</span>
                ) : (
                  '⏳'
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
