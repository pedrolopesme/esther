// Questions.tsx
export type Question = {
    question: string;
    options: string[];
    correctAnswer: string;
    type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching';
  };
  
  export const Questions: Question[] = [
    {
      question: "Qual é o resultado da adição: 456 + 305 + 12?",
      options: ["773", "753", "783", "763"],
      correctAnswer: "773",
      type: "multiple-choice"
    },
    {
      question: "Complete a adição: 148 + 208 + 304 = ?",
      options: ["660", "650", "670", "640"],
      correctAnswer: "660",
      type: "fill-blank"
    },
    {
      question: "Qual é o resultado da adição: 256 + 358 + 64?",
      options: ["678", "688", "668", "698"],
      correctAnswer: "678",
      type: "multiple-choice"
    },
    {
      question: "Se eu tenho 124 laranjas e 86 maçãs, quantas frutas tenho ao todo?",
      options: ["210", "200", "220", "190"],
      correctAnswer: "210",
      type: "multiple-choice"
    },
    {
      question: "Paula foi ao Jardim Zoológico e viu 255 periquitos e 135 papagaios. Quantas aves Paula viu ao todo?",
      options: ["390", "380", "400", "385"],
      correctAnswer: "390",
      type: "multiple-choice"
    },
    {
      question: "Em uma cesta há 486 frutas. Tirando-se 46 frutas, quantas frutas ficarão na cesta?",
      options: ["440", "430", "450", "420"],
      correctAnswer: "440",
      type: "fill-blank"
    },
    {
      question: "Marta tem 256 selos e Ana possui 123. Quantos selos Marta tem a mais que Ana?",
      options: ["133", "143", "123", "153"],
      correctAnswer: "133",
      type: "multiple-choice"
    },
    {
      question: "Em um estacionamento há 576 carros. Chegaram mais 183. Quantos carros ficaram no estacionamento?",
      options: ["759", "749", "769", "739"],
      correctAnswer: "759",
      type: "multiple-choice"
    },
    {
      question: "O resultado da subtração 94 - 57 é:",
      options: ["37", "47", "27", "43"],
      correctAnswer: "37",
      type: "multiple-choice"
    },
    {
      question: "Num jogo de basquete, o time A fez 94 pontos e o time B fez 57. Quantos pontos o time A fez a mais que o time B?",
      options: ["37", "47", "27", "43"],
      correctAnswer: "37",
      type: "fill-blank"
    },
    {
      question: "Todo número multiplicado por 0 é igual a:",
      options: ["0", "1", "O próprio número", "10"],
      correctAnswer: "0",
      type: "multiple-choice"
    },
    {
      question: "Todo número multiplicado por 1 é igual a:",
      options: ["O próprio número", "0", "1", "10"],
      correctAnswer: "O próprio número",
      type: "multiple-choice"
    },
    {
      question: "Qual é o resultado da multiplicação: 4 × 2 × 5?",
      options: ["40", "30", "20", "50"],
      correctAnswer: "40",
      type: "multiple-choice"
    },
    {
      question: "Quantos vidros há numa janela com 6 linhas e 3 colunas?",
      options: ["18", "9", "15", "21"],
      correctAnswer: "18",
      type: "multiple-choice"
    },
    {
      question: "Uma calculadora tem 4 colunas e 5 linhas de teclas. Quantas teclas há no total?",
      options: ["20", "15", "25", "18"],
      correctAnswer: "20",
      type: "multiple-choice"
    },
    {
      question: "Se num saco cabem 9 bolas, quantas bolas poderão ser colocadas em 3 sacos iguais a esse?",
      options: ["27", "18", "36", "24"],
      correctAnswer: "27",
      type: "fill-blank"
    },
    {
      question: "Carlos tem 6 caixas de brinquedos. Em cada caixa há 4 brinquedos. Se Carlos ganhar mais 10 brinquedos, com quantos brinquedos Carlos ficará?",
      options: ["34", "30", "24", "40"],
      correctAnswer: "34",
      type: "multiple-choice"
    },
    {
      question: "O sucessor de 765 + 2 é:",
      options: ["768", "767", "766", "769"],
      correctAnswer: "768",
      type: "multiple-choice"
    },
    {
      question: "O antecessor de 989 - 3 é:",
      options: ["985", "986", "984", "987"],
      correctAnswer: "985",
      type: "fill-blank"
    },
    {
      question: "A palavra DÉCIMO corresponde a qual numeral ordinal?",
      options: ["10º", "9º", "11º", "100º"],
      correctAnswer: "10º",
      type: "multiple-choice"
    },
    {
      question: "Na fila do lanche há 27 colegas na minha frente. Qual é o meu lugar de ordem?",
      options: ["28º (vigésimo oitavo)", "27º (vigésimo sétimo)", "29º (vigésimo nono)", "26º (vigésimo sexto)"],
      correctAnswer: "28º (vigésimo oitavo)",
      type: "multiple-choice"
    },
    {
      question: "Em uma sala de aula, meu número é 23. Qual é meu número de ordem?",
      options: ["23º (vigésimo terceiro)", "24º (vigésimo quarto)", "22º (vigésimo segundo)", "13º (décimo terceiro)"],
      correctAnswer: "23º (vigésimo terceiro)",
      type: "multiple-choice"
    },
    {
      question: "Se 5 × 139 = 695, então 139 × 5 é:",
      options: ["695", "596", "659", "569"],
      correctAnswer: "695",
      type: "fill-blank"
    },
    {
      question: "Em 4 vasos de flores, cada um com 6 flores, temos um total de:",
      options: ["24 flores", "20 flores", "30 flores", "18 flores"],
      correctAnswer: "24 flores",
      type: "multiple-choice"
    },
    {
      question: "É verdade que a adição e a subtração são operações inversas?",
      options: ["Verdadeiro", "Falso"],
      correctAnswer: "Verdadeiro",
      type: "true-false"
    },
    {
      question: "Na multiplicação 5 × 8 = 40, os fatores são 5 e 8, e o produto é 40.",
      options: ["Verdadeiro", "Falso"],
      correctAnswer: "Verdadeiro",
      type: "true-false"
    },
    {
      question: "Qual é o resultado da multiplicação: 260 × 3?",
      options: ["780", "680", "880", "580"],
      correctAnswer: "780",
      type: "multiple-choice"
    },
    {
      question: "Qual é o resultado da multiplicação: 2 × 489?",
      options: ["978", "898", "789", "987"],
      correctAnswer: "978",
      type: "fill-blank"
    },
    {
      question: "Complete: 21 = ? × 3",
      options: ["7", "6", "9", "4"],
      correctAnswer: "7",
      type: "multiple-choice"
    },
    {
      question: "Complete: 40 = 4 × ?",
      options: ["10", "20", "5", "8"],
      correctAnswer: "10",
      type: "multiple-choice"
    },
    {
      question: "Numa festa de aniversário estavam presentes 58 crianças. Cada criança bebeu 4 copos de refrigerantes. Quantos copos de refrigerantes foram consumidos pelas crianças?",
      options: ["232", "240", "224", "248"],
      correctAnswer: "232",
      type: "multiple-choice"
    },
    {
      question: "Patricia tem três dezenas de figurinhas. Quantas figurinhas ela tem ao todo?",
      options: ["30", "3", "300", "13"],
      correctAnswer: "30",
      type: "fill-blank"
    },
    {
      question: "Em um jogo, o número de ordem da pessoa na 100ª posição é:",
      options: ["Centésimo", "Décimo", "Milésimo", "Centésima"],
      correctAnswer: "Centésimo",
      type: "multiple-choice"
    },
    {
      question: "Na tabela de multiplicação, quanto é 7 × 8?",
      options: ["56", "48", "54", "64"],
      correctAnswer: "56",
      type: "multiple-choice"
    },
    {
      question: "Descubra o padrão: 4 × 2 = 8, 4 × 4 = 16, 4 × 6 = 24, 4 × 8 = ?",
      options: ["32", "28", "36", "40"],
      correctAnswer: "32",
      type: "fill-blank"
    },
    {
      question: "No sistema de numeração decimal, 1 centena equivale a quantas dezenas?",
      options: ["10 dezenas", "100 dezenas", "1.000 dezenas", "1 dezena"],
      correctAnswer: "10 dezenas",
      type: "multiple-choice"
    },
    {
      question: "Se tenho 4 cubos e cada cubo representa 1 unidade, quantas unidades tenho no total?",
      options: ["4 unidades", "1 unidade", "5 unidades", "3 unidades"],
      correctAnswer: "4 unidades",
      type: "multiple-choice"
    },
    {
      question: "Qual é o número que vem depois de 999?",
      options: ["1.000", "9.999", "1.001", "10.000"],
      correctAnswer: "1.000",
      type: "fill-blank"
    }
  ];