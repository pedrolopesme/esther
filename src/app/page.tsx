"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Book, Languages, Calculator, Palette, Globe, Music, Sparkles, Star } from 'lucide-react';

// Definindo as interfaces para melhorar a tipagem
interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBgColor: string;
  hoverBgColor: string;
  path: string;
  description: string;
}

interface Decoration {
  element: React.ReactNode;
  position: string;
  size: string;
  rotate: string;
}

export default function HomePage() {
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const subjects: Subject[] = [
    { 
      id: 'portugues', 
      name: 'Português', 
      icon: <Book className="w-6 h-6" />, 
      bgColor: 'bg-pink-100', 
      borderColor: 'border-pink-300',
      textColor: 'text-pink-600',
      iconBgColor: 'bg-pink-50',
      hoverBgColor: 'hover:bg-pink-200',
      path: '/materias/portugues',
      description: 'Leitura, escrita e gramática'
    },
    { 
      id: 'matematica', 
      name: 'Matemática', 
      icon: <Calculator className="w-6 h-6" />, 
      bgColor: 'bg-purple-100', 
      borderColor: 'border-purple-300',
      textColor: 'text-purple-600',
      iconBgColor: 'bg-purple-50',
      hoverBgColor: 'hover:bg-purple-200',
      path: '/materias/matematica/20250404',
      description: 'Números, operações e problemas'
    },
    // { 
    //   id: 'ingles', 
    //   name: 'Inglês', 
    //   icon: <Languages className="w-6 h-6" />, 
    //   bgColor: 'bg-blue-100', 
    //   borderColor: 'border-blue-300',
    //   textColor: 'text-blue-600',
    //   iconBgColor: 'bg-blue-50',
    //   hoverBgColor: 'hover:bg-blue-200',
    //   path: '/materias/ingles',
    //   description: 'Vocabulário e conversação'
    // },
    { 
      id: 'ciencias', 
      name: 'Ciências', 
      icon: <Globe className="w-6 h-6" />, 
      bgColor: 'bg-green-100', 
      borderColor: 'border-green-300',
      textColor: 'text-green-600',
      iconBgColor: 'bg-green-50',
      hoverBgColor: 'hover:bg-green-200',
      path: '/materias/ciencias',
      description: 'Natureza, plantas e animais'
    },
    // { 
    //   id: 'artes', 
    //   name: 'Artes', 
    //   icon: <Palette className="w-6 h-6" />, 
    //   bgColor: 'bg-amber-100', 
    //   borderColor: 'border-amber-300',
    //   textColor: 'text-amber-600',
    //   iconBgColor: 'bg-amber-50',
    //   hoverBgColor: 'hover:bg-amber-200',
    //   path: '/materias/artes',
    //   description: 'Desenho, cores e criatividade'
    // },
    // { 
    //   id: 'musica', 
    //   name: 'Música', 
    //   icon: <Music className="w-6 h-6" />, 
    //   bgColor: 'bg-rose-100', 
    //   borderColor: 'border-rose-300',
    //   textColor: 'text-rose-600',
    //   iconBgColor: 'bg-rose-50',
    //   hoverBgColor: 'hover:bg-rose-200',
    //   path: '/materias/musica',
    //   description: 'Ritmos, sons e instrumentos'
    // },
  ];

  // Elementos decorativos
  const decorations: Decoration[] = [
    { element: <Star className="w-full h-full text-yellow-400 fill-yellow-300" />, position: "top-20 left-10", size: "w-12 h-12", rotate: "rotate-12" },
    { element: <Star className="w-full h-full text-yellow-400 fill-yellow-300" />, position: "bottom-16 right-12", size: "w-10 h-10", rotate: "-rotate-12" },
    { element: <Sparkles className="w-full h-full text-pink-400" />, position: "top-32 right-16", size: "w-10 h-10", rotate: "rotate-6" },
    { element: <Sparkles className="w-full h-full text-pink-400" />, position: "bottom-28 left-20", size: "w-8 h-8", rotate: "-rotate-6" },
    { element: <Heart className="w-full h-full text-pink-400 fill-pink-200" />, position: "top-40 left-1/4", size: "w-8 h-8", rotate: "rotate-12" },
    { element: <Heart className="w-full h-full text-pink-400 fill-pink-200" />, position: "bottom-40 right-1/4", size: "w-10 h-10", rotate: "-rotate-12" },
  ];

  // Funções auxiliares para converter os valores do Tailwind para estilos CSS
  const getRotationStyle = (rotate: string): string => {
    if (rotate === 'rotate-12') return 'rotate(12deg)';
    if (rotate === '-rotate-12') return 'rotate(-12deg)';
    if (rotate === 'rotate-6') return 'rotate(6deg)';
    if (rotate === '-rotate-6') return 'rotate(-6deg)';
    return 'rotate(0)';
  };
  
  const getPositionStyle = (position: string): Record<string, string> => {
    const positions = position.split(' ');
    const result: Record<string, string> = {};
    
    positions.forEach(pos => {
      if (pos.startsWith('top-')) {
        const value = pos.replace('top-', '');
        result.top = value === '1/4' ? '25%' : 
                      value === '1/3' ? '33.333%' :
                      value === '1/2' ? '50%' :
                      `${parseInt(value, 10) * 4}px`;
      } else if (pos.startsWith('bottom-')) {
        const value = pos.replace('bottom-', '');
        result.bottom = value === '1/4' ? '25%' : 
                        value === '1/3' ? '33.333%' :
                        value === '1/2' ? '50%' :
                        `${parseInt(value, 10) * 4}px`;
      } else if (pos.startsWith('left-')) {
        const value = pos.replace('left-', '');
        result.left = value === '1/4' ? '25%' : 
                      value === '1/3' ? '33.333%' :
                      value === '1/2' ? '50%' :
                      `${parseInt(value, 10) * 4}px`;
      } else if (pos.startsWith('right-')) {
        const value = pos.replace('right-', '');
        result.right = value === '1/4' ? '25%' : 
                       value === '1/3' ? '33.333%' :
                       value === '1/2' ? '50%' :
                       `${parseInt(value, 10) * 4}px`;
      }
    });
    
    return result;
  };
  
  const getSizeStyle = (size: string): Record<string, string> => {
    const sizes = size.split(' ');
    const result: Record<string, string> = {};
    
    sizes.forEach(s => {
      if (s.startsWith('w-')) {
        const value = s.replace('w-', '');
        if (!isNaN(parseInt(value, 10))) {
          result.width = `${parseInt(value, 10) * 4}px`;
        } else {
          // Tratamento para valores não numéricos
          result.width = '100%';
        }
      }
      if (s.startsWith('h-')) {
        const value = s.replace('h-', '');
        if (!isNaN(parseInt(value, 10))) {
          result.height = `${parseInt(value, 10) * 4}px`;
        } else {
          // Tratamento para valores não numéricos
          result.height = '100%';
        }
      }
    });
    
    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 relative overflow-hidden">
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(#e5c6e2 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        opacity: 0.3
      }}></div>
      
      {/* Elementos decorativos flutuantes */}
      {mounted && decorations.map((item, index) => (
        <div 
          key={index}
          style={{ 
            position: 'absolute',
            opacity: 0.7,
            transform: getRotationStyle(item.rotate),
            animation: 'bounce 6s ease-in-out infinite',
            animationDelay: `${index * 0.5}s`,
            filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.7))',
            ...getPositionStyle(item.position),
            ...getSizeStyle(item.size)
          }}
        >
          {item.element}
        </div>
      ))}
      
      {/* Container principal */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '48px 16px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
            <h1 
              className="text-pink-600"
              style={{ 
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '8px',
                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
                textShadow: '2px 2px 4px rgba(255, 192, 203, 0.5)'
              }}
            >
              Estudos da Esther
            </h1>
            <div style={{ 
              position: 'absolute', 
              top: '-32px', 
              right: '-32px',
              animation: 'bounce 3s ease-in-out infinite'
            }}>
              <Heart className="w-16 h-16 text-pink-500 fill-pink-200" />
            </div>
          </div>
          <p style={{ 
            fontSize: '20px', 
            color: '#7e3b92', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Vamos revisar as matérias da escola de um jeito divertido e mágico!
          </p>
        </div>
        
        {/* Flexbox de matérias */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '32px',
          margin: '80px 0' 
        }}>
          {subjects.map((subject) => (
            <div 
              key={subject.id}
              className={`
                opacity-0 translate-y-4
                ${mounted ? 'animate-[fadeIn_0.6s_ease-out_forwards]' : ''}
              `}
              style={{ 
                width: '280px',
                flexShrink: 0,
                animationDelay: `${subjects.indexOf(subject) * 0.1}s`,
                animationFillMode: 'forwards',
                margin: '0 8px'
              }}
            >
              <Link href={subject.path}>
                <div 
                  className={`
                    relative rounded-xl shadow-lg transition-all duration-300 
                    ${subject.bgColor} ${subject.borderColor} ${subject.hoverBgColor}
                    border-2 hover:shadow-xl hover:-translate-y-1 h-full
                  `}
                  style={{
                    padding: '24px',
                    height: '100%'
                  }}
                  onMouseEnter={() => setHoveredSubject(subject.id)}
                  onMouseLeave={() => setHoveredSubject(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className={`rounded-full ${subject.iconBgColor} shadow-sm`} style={{ padding: '12px', marginRight: '16px' }}>
                      <div className={subject.textColor}>{subject.icon}</div>
                    </div>
                    <h2 className={`text-2xl font-bold ${subject.textColor}`}>
                      {subject.name}
                    </h2>
                  </div>
                  <p className={`${subject.textColor} opacity-80`} style={{ marginTop: '16px' }}>
                    {subject.description}
                  </p>
                  
                  {/* Decorative icon at bottom right */}

                  
                  {/* Sparkle effect on hover */}
                  {hoveredSubject === subject.id && (
                    <div className="absolute animate-[spin_3s_linear_infinite]" style={{ top: '4px', right: '4px', width: '24px', height: '24px' }}>
                      <Sparkles className="w-full h-full text-white" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Rodapé */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '80px', 
          color: '#9333ea' 
        }}>
          <p style={{ fontSize: '18px' }}>
            Feito com <Heart className="inline w-5 h-5 text-pink-500 fill-pink-300" /> para Esther
          </p>
        </div>
      </div>
      
      {/* Keyframes animations for fade in */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}