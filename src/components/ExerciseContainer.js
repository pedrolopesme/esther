"use client";

export default function ExerciseContainer({ children, className = '' }) {
  return (
    <div className={`duolingo-exercise-container ${className}`}>
      {children}
    </div>
  );
}