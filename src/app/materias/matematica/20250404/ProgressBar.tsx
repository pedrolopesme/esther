// ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-600 rounded-full h-6 border-2 border-gray-800">
      <div 
        className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end px-2"
        style={{ width: `${progress}%` }}
      >
        {progress > 10 && (
          <span className="text-xs text-white font-bold">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  );
};