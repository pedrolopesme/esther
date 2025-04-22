# Esther - Plataforma de Exercícios Escolares

Este projeto é uma plataforma inspirada no Duolingo, mas focada em exercícios escolares para crianças de 8 anos. O objetivo é proporcionar uma experiência gamificada para os estudantes praticarem o conteúdo aprendido na escola.

## Características

- Interface amigável inspirada no Duolingo
- Divisão por matérias escolares (Matemática, Português, Inglês, Ciências)
- Exercícios interativos do tipo "marque a opção correta"
- Feedback imediato para as respostas
- Barra de progresso para acompanhamento
- Design responsivo para diferentes dispositivos

## Tecnologias Utilizadas

- Next.js 15
- React 19
- TailwindCSS 4
- JSON para armazenamento dos exercícios

## Estrutura dos Dados

Os exercícios são armazenados em arquivos JSON com a seguinte estrutura:

```json
{
  "title": "Título da Lista de Exercícios",
  "description": "Descrição da lista de exercícios",
  "exercises": [
    {
      "type": "multiple-choice",
      "question": "Pergunta do exercício",
      "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
      "correctIndex": 2
    }
  ]
}
```

## Executando o Projeto

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar o servidor de produção
npm start
```

## Componentes de UI

O projeto inclui vários componentes inspirados no estilo visual do Duolingo:

- Button - Botão principal com estilo Duolingo
- Card - Card para conteúdo
- ExerciseContainer - Container para os exercícios
- Feedback - Componente para feedback de respostas
- MultipleChoiceExercise - Exercício de múltipla escolha
- OptionCard - Card para opções de resposta
- ProgressBar - Barra de progresso
- Question - Componente para exibir perguntas
- SubjectCard - Card para exibir matérias

## Desenvolvimento Futuro

- Adicionar mais tipos de exercícios
- Implementar sistema de pontuação e conquistas
- Adicionar suporte para áudio e imagens nos exercícios
- Criar painel administrativo para professores adicionarem exercícios