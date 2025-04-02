"use client"

import React, { useState, useEffect } from 'react';

// Definição de interfaces
interface MaterialType {
  id: string;
  name: string;
  description: string;
  lightBehavior: string;
  examples: string[];
  color: string;
  illustration: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const LightMaterialsApp: React.FC = () => {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dados dos materiais
  const materialTypes: MaterialType[] = [
    {
      id: 'opaque',
      name: 'Opaco',
      description: 'Ao incidir sobre um objeto opaco, a luz não será transmitida, mas absorvida.',
      lightBehavior: 'A luz não passa através do material',
      examples: ['Madeira', 'Paredes', 'Livros', 'Cadeiras', 'Portas'],
      color: '#D97706', // âmbar-600
      illustration: '🚪'
    },
    {
      id: 'translucid',
      name: 'Translúcido',
      description: 'Ao incidir sobre objetos translúcidos, a luz passará parcialmente, pois parte é absorvida.',
      lightBehavior: 'A luz passa parcialmente, criando imagens embaçadas',
      examples: ['Vidro jateado', 'Papel vegetal', 'Plástico fosco', 'Papel manteiga', 'Tecido fino'],
      color: '#FBBF24', // âmbar-400
      illustration: '🪟'
    },
    {
      id: 'transparent',
      name: 'Transparente',
      description: 'Ao incidir num meio transparente, a luz não será absorvida, nem refletida, transpassando para o outro lado da superfície.',
      lightBehavior: 'A luz passa completamente através do material',
      examples: ['Vidros de janela', 'Água limpa', 'Aquários', 'Lentes', 'Ar puro'],
      color: '#8B5CF6', // violeta-500
      illustration: '🥛'
    },
    {
      id: 'mirror',
      name: 'Espelhado',
      description: 'Ao incidir sobre um objeto espelhado, a luz é refletida e não transpassa pela superfície.',
      lightBehavior: 'A luz é refletida pela superfície',
      examples: ['Espelhos', 'Superfícies polidas', 'Metais brilhantes', 'CD/DVD', 'Alumínio'],
      color: '#34D399', // esmeralda-400
      illustration: '🪞'
    }
  ];

  // Perguntas do quiz
  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: "Um objeto opaco é aquele que:",
      options: [
        "A luz passa completamente",
        "A luz não passa, sendo absorvida",
        "A luz é completamente refletida",
        "A luz passa parcialmente"
      ],
      correctAnswer: 1,
      explanation: "Em objetos opacos, como madeira ou paredes, a luz não consegue passar através deles, sendo absorvida."
    },
    {
      id: 2,
      question: "Qual das alternativas abaixo contém apenas objetos transparentes?",
      options: [
        "Caderno e mochila",
        "Lápis e borracha",
        "Copo de vidro e lâmpada",
        "Espelho e garrafa térmica"
      ],
      correctAnswer: 2,
      explanation: "Copos de vidro e lâmpadas são transparentes, permitindo que a luz passe completamente através deles."
    },
    {
      id: 3,
      question: "Quando a luz incide sobre um objeto espelhado, o que acontece?",
      options: [
        "A luz é absorvida",
        "A luz passa parcialmente",
        "A luz passa completamente",
        "A luz é refletida"
      ],
      correctAnswer: 3,
      explanation: "Em superfícies espelhadas, a luz é refletida e não passa através do objeto."
    },
    {
      id: 4,
      question: "O fenômeno que permite a formação de sombras ocorre quando a luz incide sobre:",
      options: [
        "Objetos translúcidos",
        "Objetos transparentes",
        "Objetos opacos",
        "Objetos espelhados"
      ],
      correctAnswer: 2,
      explanation: "As sombras são formadas quando a luz incide sobre objetos opacos, que funcionam como obstáculos para a passagem da luz."
    },
    {
      id: 5,
      question: "Um vidro jateado é um exemplo de material:",
      options: [
        "Opaco",
        "Translúcido",
        "Transparente",
        "Espelhado"
      ],
      correctAnswer: 1,
      explanation: "O vidro jateado é translúcido, pois permite a passagem parcial da luz, fazendo com que vejamos imagens embaçadas através dele."
    }
  ];

  const handleMaterialSelect = (id: string): void => {
    setSelectedMaterial(id);
  };

  const startQuiz = (): void => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answerIndex: number): void => {
    setSelectedAnswer(answerIndex);
  };

  const goToNextQuestion = (): void => {
    // Verificar se a resposta está correta e atualizar a pontuação
    if (selectedAnswer === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    // Avançar para a próxima pergunta ou mostrar resultados
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = (): void => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const backToMaterials = (): void => {
    setQuizStarted(false);
    setSelectedMaterial(null);
  };

  const getFeedback = (): string => {
    const percentage = (score / quizQuestions.length) * 100;
    
    if (percentage >= 80) {
      return "Incrível! Você dominou o conteúdo sobre luz e materiais!";
    } else if (percentage >= 60) {
      return "Muito bom! Você está compreendendo bem o assunto.";
    } else if (percentage >= 40) {
      return "Continue estudando. Você está no caminho certo!";
    } else {
      return "Vamos revisar o conteúdo novamente para entender melhor os conceitos.";
    }
  };

  // Renderização da tela inicial com os tipos de materiais
  const renderMaterialsList = (): React.ReactNode => {
    return (
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          textAlign: 'center',
          color: '#4B5563'
        }}>
          Como a luz se comporta nos diferentes materiais?
        </h2>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {materialTypes.map((material) => (
            <div
              key={material.id}
              onClick={() => handleMaterialSelect(material.id)}
              style={{
                width: '200px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: material.color,
                color: 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${materialTypes.indexOf(material) * 0.1}s`,
                transitionDuration: '0.5s'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {material.illustration}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                Material {material.name}
              </h3>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={startQuiz}
            style={{
              backgroundColor: '#EC4899', // rosa
              color: 'white',
              padding: '12px 24px',
              borderRadius: '9999px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(236, 72, 153, 0.3)'
            }}
          >
            Testar Meus Conhecimentos
          </button>
        </div>
      </div>
    );
  };

  // Renderização dos detalhes de um material específico
  const renderMaterialDetails = (): React.ReactNode => {
    if (!selectedMaterial) return null;
    
    const material = materialTypes.find(m => m.id === selectedMaterial);
    if (!material) return null;
    
    return (
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        margin: '32px auto'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: `4px solid ${material.color}`,
          paddingBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '64px', 
            marginRight: '16px' 
          }}>
            {material.illustration}
          </div>
          <div>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1F2937',
              marginBottom: '4px'
            }}>
              Material {material.name}
            </h2>
            <p style={{ 
              color: material.color,
              fontWeight: 'bold'
            }}>
              {material.lightBehavior}
            </p>
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            color: '#4B5563' 
          }}>
            O que acontece com a luz:
          </h3>
          <p style={{ 
            fontSize: '16px', 
            color: '#4B5563',
            lineHeight: '1.5'
          }}>
            {material.description}
          </p>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            color: '#4B5563' 
          }}>
            Exemplos:
          </h3>
          <ul style={{ 
            paddingLeft: '20px',
            color: '#4B5563'
          }}>
            {material.examples.map((example, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{example}</li>
            ))}
          </ul>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '24px'  
        }}>
          <button
            onClick={() => setSelectedMaterial(null)}
            style={{
              backgroundColor: '#F3F4F6',
              color: '#4B5563',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Voltar aos Materiais
          </button>
          
          <button
            onClick={startQuiz}
            style={{
              backgroundColor: '#EC4899',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Testar Conhecimentos
          </button>
        </div>
      </div>
    );
  };

  // Renderização do quiz
  const renderQuiz = (): React.ReactNode => {
    if (showResults) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          margin: '32px auto',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#FCE7F3', 
              borderRadius: '9999px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <span style={{ fontSize: '30px', fontWeight: 'bold', color: '#DB2777' }}>
                {score}
              </span>
            </div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1F2937', 
              marginBottom: '8px' 
            }}>
              Sua pontuação: {score} de {quizQuestions.length}
            </h2>
            <p style={{ color: '#7E22CE', fontSize: '18px' }}>
              {getFeedback()}
            </p>
          </div>
          
          {/* Pontuação em círculo */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              width: '192px', 
              height: '192px', 
              position: 'relative',
              margin: '0 auto'
            }}>
              <div style={{ 
                position: 'absolute', 
                inset: '0', 
                borderRadius: '9999px', 
                backgroundColor: '#FCE7F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold', 
                  color: '#DB2777' 
                }}>
                  {Math.round((score / quizQuestions.length) * 100)}%
                </span>
              </div>
              <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#FBD0E0"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * score) / quizQuestions.length}
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button
              onClick={restartQuiz}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#EC4899', 
                color: 'white', 
                borderRadius: '9999px', 
                fontWeight: '500',
                border: 'none', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
            >
              Tentar Novamente
            </button>
            
            <button
              onClick={backToMaterials}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#F3F4F6', 
                color: '#4B5563', 
                borderRadius: '9999px', 
                fontWeight: '500',
                border: 'none', 
                cursor: 'pointer'
              }}
            >
              Voltar aos Materiais
            </button>
          </div>
        </div>
      );
    }
    
    // Renderização das perguntas do quiz
    const currentQuestionObj = quizQuestions[currentQuestion];
    
    return (
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        margin: '32px auto'
      }}>
        {/* Progresso */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px' 
          }}>
            <span style={{ color: '#7E22CE', fontWeight: '500' }}>
              Pergunta {currentQuestion + 1} de {quizQuestions.length}
            </span>
            <span style={{ color: '#7E22CE', fontWeight: '500' }}>
              Pontos: {score}
            </span>
          </div>
          <div style={{ 
            height: '8px', 
            backgroundColor: '#FCE7F3', 
            borderRadius: '9999px', 
            overflow: 'hidden' 
          }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: '#EC4899', 
                width: `${((currentQuestion) / quizQuestions.length) * 100}%`,
                transition: 'width 0.5s'
              }}
            ></div>
          </div>
        </div>
        
        {/* Pergunta */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1F2937', 
            marginBottom: '16px' 
          }}>
            {currentQuestionObj.question}
          </h2>
          
          {/* Opções */}
          <div style={{ marginTop: '15px' }}>
            {currentQuestionObj.options.map((option, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '12px', 
                  border: '1px solid', 
                  borderColor: selectedAnswer === index ? '#F472B6' : '#E5E7EB',
                  borderRadius: '12px', 
                  marginBottom: '12px',
                  backgroundColor: selectedAnswer === index ? '#FCE7F3' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleAnswerSelect(index)}
              >
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    style={{ 
                      height: '20px', 
                      width: '20px',
                      accentColor: '#DB2777'
                    }}
                    checked={selectedAnswer === index}
                    onChange={() => handleAnswerSelect(index)}
                  />
                  <span style={{ marginLeft: '10px', color: '#1F2937' }}>{option}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Explicação */}
        {showExplanation && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            backgroundColor: '#EFF6FF', 
            borderRadius: '8px', 
            border: '1px solid #BFDBFE' 
          }}>
            <p style={{ color: '#1E40AF' }}>{currentQuestionObj.explanation}</p>
          </div>
        )}
        
        {/* Botões de controle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '24px' 
        }}>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            style={{ 
              padding: '8px 16px', 
              color: '#7E22CE',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {showExplanation ? "Ocultar explicação" : "Ver explicação"}
          </button>
          
          <button
            onClick={goToNextQuestion}
            disabled={selectedAnswer === null}
            style={{ 
              padding: '8px 24px', 
              borderRadius: '9999px', 
              fontWeight: '500',
              backgroundColor: selectedAnswer === null ? '#E5E7EB' : '#EC4899',
              color: selectedAnswer === null ? '#6B7280' : 'white',
              border: 'none',
              cursor: selectedAnswer === null ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {currentQuestion === quizQuestions.length - 1 ? "Finalizar" : "Próxima"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to right, #FDF2F8, #F5F3FF)',
      padding: '32px 0'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '30px', 
            fontWeight: 'bold', 
            color: '#DB2777', 
            marginBottom: '8px',
            fontFamily: "'Comic Sans MS', 'Comic Sans', cursive"
          }}>
            Efeito da Luz nos Materiais
          </h1>
          <p style={{ color: '#7E22CE' }}>
            Descobrindo como a luz se comporta ao incidir sobre diferentes materiais
          </p>
        </div>
        
        {/* Conteúdo principal */}
        {quizStarted ? (
          renderQuiz()
        ) : selectedMaterial ? (
          renderMaterialDetails()
        ) : (
          renderMaterialsList()
        )}
      </div>
    </div>
  );
};

export default LightMaterialsApp;