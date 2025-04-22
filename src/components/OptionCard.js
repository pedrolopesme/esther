"use client";

export default function OptionCard({ children, selected, correct, incorrect, onClick }) {
  const getClassNames = () => {
    let classes = 'duolingo-option';
    if (selected) classes += ' selected';
    if (correct) classes += ' correct';
    if (incorrect) classes += ' incorrect';
    return classes;
  };

  return (
    <div className={getClassNames()} onClick={onClick}>
      {children}
    </div>
  );
}