"use client";

export default function ProgressBar({ progress, className = '' }) {
  return (
    <div className={`duolingo-progress-bar ${className}`}>
      <div 
        className="duolingo-progress-bar-fill" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}