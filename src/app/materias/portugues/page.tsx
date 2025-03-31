"use client"

import React, { useState } from 'react';

// Definir interfaces para garantir tipagem correta
interface Question {
  id: number;
  question: string;
  options: string[];
  correct: string;
  type: string;
  explanation: string;
}

interface AnswersState {
  [key: number]: string;
}

const QuizApp = () => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "O Sol e a Lua eram ________ que se transformaram em astros celestes.",
      options: ["irmãos", "primos", "amigos", "vizinhos"],
      correct: "irmãos",
      type: "radio",
      explanation: "No texto, aprendemos que o Sol e a Lua eram irmãos que se transformaram em astros."
    },
    {
      id: 2,
      question: "Marque a alternativa que contém apenas encontros vocálicos:",
      options: ["trem, prato, flores", "lua, noite, dia", "irmão, pai, noite", "livro, página, tarde"],
      correct: "lua, noite, dia",
      type: "radio",
      explanation: "Encontros vocálicos são junções de vogais na mesma palavra. Em 'lua', 'noite' e 'dia' temos esses encontros."
    },
    {
      id: 3,
      question: "A menina se transformou em _______ para fugir de seu irmão.",
      options: ["Estrela", "Sol", "Lua", "Cometa"],
      correct: "Lua",
      type: "radio",
      explanation: "De acordo com a história, a menina se transformou em Lua para fugir do irmão, que depois se transformou em Sol."
    },
    {
      id: 4,
      question: "Separe as sílabas da palavra TARTARUGA:",
      options: ["tar-ta-ru-ga", "ta-rta-ru-ga", "tar-ta-rug-a", "ta-rta-rug-a"],
      correct: "tar-ta-ru-ga",
      type: "radio",
      explanation: "A separação correta é 'tar-ta-ru-ga', pois cada sílaba contém uma vogal ou ditongo."
    },
    {
      id: 5,
      question: "Assinale a alternativa que contém um dígrafo:",
      options: ["prato", "blusa", "flores", "sonho"],
      correct: "sonho",
      type: "radio",
      explanation: "Em 'sonho', temos o dígrafo 'nh', onde duas letras representam um único som."
    },
    {
      id: 6,
      question: "Na Lua _________ é bom cortar os cabelos, pois eles crescem rapidinho.",
      options: ["nova", "cheia", "crescente", "minguante"],
      correct: "crescente",
      type: "radio",
      explanation: "Conforme o texto, na Lua crescente é bom cortar os cabelos para que cresçam rapidamente."
    },
    {
      id: 7,
      question: "Que tipo de encontro vocálico temos na palavra 'céu'?",
      options: ["Ditongo", "Tritongo", "Hiato", "Dígrafo"],
      correct: "Ditongo",
      type: "radio",
      explanation: "Em 'céu', temos o ditongo 'éu', onde duas vogais estão na mesma sílaba."
    },
    {
      id: 8,
      question: "Marque a alternativa que contém apenas palavras com encontro consonantal:",
      options: ["casa, mesa, livro", "prato, blusa, flor", "cachorro, gato, pássaro", "chapéu, chuva, chinelo"],
      correct: "prato, blusa, flor",
      type: "radio",
      explanation: "Em 'prato' (pr), 'blusa' (bl) e 'flor' (fl), temos encontros consonantais, que são duas consoantes juntas."
    },
    {
      id: 9,
      question: "O Projeto Tamar busca a _____________ das tartarugas marinhas.",
      options: ["adoção", "alimentação", "preservação", "domesticação"],
      correct: "preservação",
      type: "radio",
      explanation: "O Projeto Tamar tem como objetivo a preservação das tartarugas marinhas em seu habitat natural."
    },
    {
      id: 10,
      question: "Assinale a alternativa FALSA sobre o texto 'A origem do Sol e da Lua':",
      options: [
        "Os irmãos se davam muito bem quando crianças", 
        "O irmão perseguia a irmã por inveja", 
        "A menina fugiu para o céu", 
        "Os pais incentivaram as brigas entre os filhos"
      ],
      correct: "Os pais incentivaram as brigas entre os filhos",
      type: "radio",
      explanation: "No texto, os pais ficaram tristes e espantados com as brigas entre os filhos, não as incentivaram."
    },
    {
      id: 11,
      question: "Complete a frase com MAS ou MAIS: 'Eu gosto muito de algas. Quando eu era _______ nova, nadava por todo o litoral.'",
      options: ["mas", "mais"],
      correct: "mais",
      type: "radio",
      explanation: "'Mais' é usado para indicar quantidade ou intensidade, como em 'mais nova'."
    },
    {
      id: 12,
      question: "Que tipo de encontro consonantal temos na palavra 'crianças'?",
      options: ["cr", "nc", "an", "ça"],
      correct: "cr",
      type: "radio",
      explanation: "Em 'crianças', o encontro consonantal é 'cr', pois são duas consoantes juntas no início da palavra."
    },
    {
      id: 13,
      question: "Complete a frase: 'O irmão conseguiu ir para o céu em forma de _______.'",
      options: ["Lua", "estrela", "Sol", "cometa"],
      correct: "Sol",
      type: "radio",
      explanation: "De acordo com a história, o irmão se transformou em Sol para seguir sua irmã que havia se transformado em Lua."
    },
    {
      id: 14,
      question: "Marque a alternativa que contém apenas dígrafos:",
      options: ["prato, flor, claro", "placa, cruz, trovão", "sonho, pente, carro", "trem, plano, floresta"],
      correct: "sonho, pente, carro",
      type: "radio",
      explanation: "Em 'sonho' (nh), 'pente' (en) e 'carro' (rr), temos dígrafos, que são duas letras representando um único som."
    },
    {
      id: 15,
      question: "Complete a frase da tartaruga: 'Estou descansando para ir ao encontro de minha prima _______ Aruanã.'",
      options: ["Lola", "Lili", "Luna", "Linda"],
      correct: "Lili",
      type: "radio",
      explanation: "No texto, a tartaruga menciona que vai encontrar sua prima Lili Aruanã."
    },
    {
      id: 16,
      question: "O que acontece quando o Sol (irmão) alcança a Lua (irmã)?",
      options: ["Nascem as estrelas", "Ocorre o arco-íris", "Acontece um eclipse lunar", "Surge o dia"],
      correct: "Acontece um eclipse lunar",
      type: "radio",
      explanation: "De acordo com a história, quando o Sol alcança a Lua, ocorre um eclipse lunar."
    },
    {
      id: 17,
      question: "Complete a lacuna: O projeto ________ busca a preservação das tartarugas marinhas.",
      options: ["Tartaruga", "Tamar", "Oceano", "Ambiente"],
      correct: "Tamar",
      type: "radio",
      explanation: "O projeto que trabalha com a preservação das tartarugas marinhas é o Projeto Tamar."
    },
    {
      id: 18,
      question: "O que a Gigi queria ser quando crescesse?",
      options: ["Professora", "Médica", "Escritora", "Bióloga"],
      correct: "Escritora",
      type: "radio",
      explanation: "No texto, Gigi menciona que quer ser escritora quando crescer."
    },
    {
      id: 19,
      question: "Complete a frase: 'As tartarugas marinhas têm conseguido manter seu ciclo ________.'",
      options: ["anual", "natural", "sazonal", "reprodutivo"],
      correct: "natural",
      type: "radio",
      explanation: "Segundo o texto sobre o Projeto Tamar, as tartarugas têm conseguido manter seu ciclo natural."
    },
    {
      id: 20,
      question: "Marque a alternativa que contém uma palavra com hiato:",
      options: ["noite", "pai", "saúde", "céu"],
      correct: "saúde",
      type: "radio",
      explanation: "Em 'saúde', temos o hiato 'a-ú', pois são duas vogais em sílabas diferentes."
    }
  ];

  const handleAnswer = (answer: string): void => {
    const newAnswers: AnswersState = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);
  };

  const handleNextQuestion = (): void => {
    const correct = questions[currentQuestion].correct;
    const currentAnswer = answers[currentQuestion];
    
    if (currentAnswer === correct) {
      setScore(score + 1);
    }
    
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = (): void => {
    setCurrentQuestion(0);
    setScore(0);
    setAnswers({});
    setShowResults(false);
    setShowExplanation(false);
  };

  const getFeedback = (): string => {
    const percentage = (score / questions.length) * 100;
    
    if (percentage >= 90) {
      return "Incrível, Esther! Você é uma especialista em português!";
    } else if (percentage >= 70) {
      return "Excelente! Você domina bem as sílabas e encontros vocálicos e consonantais.";
    } else if (percentage >= 50) {
      return "Muito bom! Você está entendendo bem o conteúdo.";
    } else {
      return "Continue praticando! Você está no caminho certo.";
    }
  };

  const renderOptions = (): React.ReactNode => {
    const question = questions[currentQuestion];
    
    if (question.type === "radio") {
      return (
        <div style={{ marginTop: '15px' }}>
          {question.options.map((option, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '12px', 
                border: '1px solid', 
                borderColor: answers[currentQuestion] === option ? '#F472B6' : '#E5E7EB',
                borderRadius: '12px', 
                marginBottom: '12px',
                backgroundColor: answers[currentQuestion] === option ? '#FCE7F3' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => handleAnswer(option)}
            >
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  style={{ 
                    height: '20px', 
                    width: '20px',
                    accentColor: '#DB2777'
                  }}
                  checked={answers[currentQuestion] === option}
                  onChange={() => handleAnswer(option)}
                />
                <span style={{ marginLeft: '10px', color: '#1F2937' }}>{option}</span>
              </label>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  const currentQuestionObj = questions[currentQuestion];
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to right, #FDF2F8, #F5F3FF)',
      padding: '32px 0'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '30px', 
            fontWeight: 'bold', 
            color: '#DB2777', 
            marginBottom: '8px',
            fontFamily: "'Comic Sans MS', 'Comic Sans', cursive"
          }}>
            Quiz de Português da Esther
          </h1>
          <p style={{ color: '#7E22CE' }}>Vamos revisar o que você aprendeu!</p>
        </div>
        
        {/* Card principal */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          border: '2px solid #FBCFE8',
          overflow: 'hidden'
        }}>
          {!showResults ? (
            <div style={{ padding: '24px' }}>
              {/* Progresso */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ color: '#7E22CE', fontWeight: '500' }}>
                    Pergunta {currentQuestion + 1} de {questions.length}
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
                      width: `${((currentQuestion) / questions.length) * 100}%`,
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
                {renderOptions()}
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
                  onClick={handleNextQuestion}
                  disabled={answers[currentQuestion] === undefined}
                  style={{ 
                    padding: '8px 24px', 
                    borderRadius: '9999px', 
                    fontWeight: '500',
                    backgroundColor: answers[currentQuestion] === undefined ? '#E5E7EB' : '#EC4899',
                    color: answers[currentQuestion] === undefined ? '#6B7280' : 'white',
                    border: 'none',
                    cursor: answers[currentQuestion] === undefined ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  {currentQuestion === questions.length - 1 ? "Finalizar" : "Próxima"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center' }}>
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
                  Sua pontuação: {score} de {questions.length}
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
                      {Math.round((score / questions.length) * 100)}%
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
                      strokeDashoffset={282.7 - (282.7 * score) / questions.length}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={restartQuiz}
                style={{ 
                  padding: '12px 32px', 
                  backgroundColor: '#EC4899', 
                  color: 'white', 
                  borderRadius: '9999px', 
                  fontWeight: '500',
                  border: 'none', 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer'
                }}
              >
                Jogar Novamente
              </button>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px', 
          color: '#6B7280', 
          fontSize: '14px' 
        }}>
          <p>Quiz de revisão de Português para Esther</p>
        </div>
      </div>
    </div>
  );
};

export default QuizApp;