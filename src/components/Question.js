"use client";

export default function Question({ children, className = '' }) {
  return (
    <h2 className={`duolingo-exercise-question ${className}`}>
      {children}
    </h2>
  );
}