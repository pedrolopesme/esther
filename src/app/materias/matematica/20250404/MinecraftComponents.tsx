// MinecraftComponents.tsx
import React from 'react';

interface MinecraftButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const MinecraftButton: React.FC<MinecraftButtonProps> = ({ 
  children, 
  onClick, 
  className = "",
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative py-2 px-4 
        bg-gray-500 hover:bg-gray-400 active:bg-gray-600
        text-white font-bold 
        border-b-4 border-r-4 border-gray-900
        active:border-b-2 active:border-r-2 
        active:translate-y-1 active:translate-x-1
        transition-all duration-100
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-600 rounded-full h-6 border-2 border-gray-800">
      <div 
        className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const CharacterSelection: React.FC<{ onSelect: (character: string) => void }> = ({ onSelect }) => {
  return (
    <div className="bg-green-800 min-h-screen p-4 font-minecraft flex items-center justify-center">
      <div className="bg-gray-800 bg-opacity-80 rounded-lg p-8 shadow-lg border-4 border-gray-900 max-w-2xl w-full">
        <h1 className="text-3xl text-white text-center mb-8">Escolha seu personagem</h1>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <img src="/images/steve.png" alt="Steve" className="w-32 h-32 mb-4" />
            <MinecraftButton onClick={() => onSelect('steve')}>
              Steve
            </MinecraftButton>
          </div>
          <div className="flex flex-col items-center">
            <img src="/images/alex.png" alt="Alex" className="w-32 h-32 mb-4" />
            <MinecraftButton onClick={() => onSelect('alex')}>
              Alex
            </MinecraftButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResultScreen: React.FC<{ 
  score: number; 
  totalQuestions: number; 
  diamonds: number;
  character: string;
  onRestart: () => void;
}> = ({ score, totalQuestions, diamonds, character, onRestart }) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  let message = "";
  let bgColor = "";
  
  if (percentage >= 90) {
    message = "Incrível! Você é um mestre do Minecraft!";
    bgColor = "bg-green-600";
  } else if (percentage >= 70) {
    message = "Muito bom! Continue minerando conhecimento!";
    bgColor = "bg-green-500";
  } else if (percentage >= 50) {
    message = "Bom trabalho! Você está aprendendo bem!";
    bgColor = "bg-yellow-500";
  } else {
    message = "Continue praticando! A cada erro aprendemos mais!";
    bgColor = "bg-red-500";
  }

  return (
    <div className="bg-green-800 min-h-screen p-4 font-minecraft flex items-center justify-center">
      <div className="bg-gray-800 bg-opacity-80 rounded-lg p-8 shadow-lg border-4 border-gray-900 max-w-2xl w-full">
        <h1 className="text-3xl text-white text-center mb-6">Resultados</h1>
        
        <div className="flex justify-center mb-8">
          <img src={`/images/${character}.png`} alt={character} className="w-32 h-32" />
        </div>
        
        <div className={`${bgColor} p-4 rounded-lg text-white text-center mb-6`}>
          {message}
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <div className="text-white text-xl text-center">
            Você acertou {score} de {totalQuestions} questões!
          </div>
          <div className="text-white text-xl text-center mt-2">
            ({percentage}%)
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/images/diamond.png" alt="Diamantes" className="w-8 h-8" />
          <span className="text-white font-bold text-xl">{diamonds} diamantes coletados!</span>
        </div>
        
        <div className="flex justify-center">
          <MinecraftButton onClick={onRestart}>
            Jogar Novamente
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};