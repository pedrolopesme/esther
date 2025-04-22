"use client";

export default function Card({ children, className = '' }) {
  return (
    <div className={`duolingo-card ${className}`}>
      {children}
    </div>
  );
}