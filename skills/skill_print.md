
# 🎨 Skill: Gerador de Missões de Estudo (Versão Kids 9 anos)

## 🎯 Objetivo
Transformar o arquivo Markdown de revisão (gerado pela Skill de Revisão Master) em uma **Lista de Exercícios Práticos e Divertidos**. O resultado final deve ser um código HTML otimizado para impressão em papel A4, focado em engajamento, ludicidade e correção de pontos fracos de uma criança de 9 anos.

---

## 📝 Instruções de Sistema (System Prompt)

### 1. Processamento e Estratégia Pedagógica
* **Foco no Erro:** Analise as seções "Análise de Padrões de Erro" e "Plano de Ação" do material de revisão. Gere questões que ataquem diretamente as dificuldades (sejam elas interpretativas ou de cálculo).
* **Volume de Prática:** Gere obrigatoriamente entre **10 e 20 exercícios**.
* **Progressão:** Comece com desafios simples para dar confiança e termine com 2 "Super Desafios" (Nível Mestre).

### 2. Tematização e Linguagem (9 anos)
* **Linguagem Acessível:** Substitua termos técnicos por explicações simples. Use frases curtas.
* **Linguagem Lúdica:** Use termos como "Explorador(a)", "Missão", "Código Secreto" e "Nível de Energia".
* **Contexto Infantil:** Envolva os exercícios em temas como Minecraft, Roblox, Super-heróis, Espaço, Animais ou situações divertidas do cotidiano escolar.
* **Exemplo:** Em vez de "Resolva a subtração 50-12", use "Um astronauta tinha 50 tanques de oxigênio, mas 12 furaram no caminho para Marte. Quantos sobraram para ele completar a missão?".

### 3. Diretrizes de Design para Impressão (HTML/CSS)
* **Formato:** O código HTML deve ser formatado para uma folha A4 (210mm x 297mm).
* **Espaço de Escrita:** * Para respostas de texto: Inclua pelo menos 3 linhas sólidas ou pontilhadas (espaçamento de 1cm).
    * Para cálculos: Crie boxes grandes (mínimo 3cm de altura) com bordas suaves.
* **Visual:** Use fontes sem serifa modernas (Arial, Segoe UI). Inclua elementos como "badges" (etiquetas) para indicar o nível de dificuldade da questão.
* **Impressão:** Use cores que mantenham o contraste e a leitura clara mesmo em impressoras preto e branco.

---

## 📋 Estrutura do Documento HTML

A Skill deve gerar o código contendo:
1. **Cabeçalho Gamer:** Campos para "Nome do Explorador", "Data da Missão" e "Nível de Energia [█████]".
2. **Bloco de Exercícios:** Lista numerada com enunciados envolventes e espaços generosos para resposta.
3. **Desafio Criativo:** Pelo menos uma questão que peça para a criança desenhar ou criar algo baseado na matéria.
4. **Rodapé Motivador:** Frases de incentivo como "Você subiu de nível! 🚀" ou "Rumo à vitória! 🌟".

---

## 🛠 Configuração Técnica (CSS Base)

A Skill deve incluir este CSS no cabeçalho do HTML:
```css
@media print { .no-print { display: none; } @page { margin: 15mm; } }
body { font-family: 'Segoe UI', sans-serif; color: #2c3e50; line-height: 1.6; }
.sheet { max-width: 800px; margin: auto; padding: 20px; }
.header { border: 2px solid #3498db; border-radius: 15px; padding: 20px; margin-bottom: 30px; }
.question { margin-bottom: 35px; page-break-inside: avoid; }
.question-text { font-size: 1.1em; font-weight: bold; color: #2980b9; }
.answer-line { border-bottom: 1px solid #bdc3c7; height: 35px; margin: 10px 0; }
.calc-box { border: 2px dashed #3498db; border-radius: 10px; min-height: 100px; margin-top: 10px; position: relative; }
.badge { background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 5px; }
