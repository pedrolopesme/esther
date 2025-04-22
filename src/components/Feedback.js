"use client";

export default function Feedback({ children, correct, className = '' }) {
  const baseClass = 'duolingo-feedback';
  const feedbackClass = correct ? `${baseClass} correct` : `${baseClass} incorrect`;
  
  return (
    <div className={`${feedbackClass} ${className}`}>
      {children}
    </div>
  );
}