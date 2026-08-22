# 🎨 Skill: Gerador de Missões de Estudo (Versão Kids 9 anos - Econômica)

## 🎯 Objetivo
Transformar o arquivo Markdown de revisão em uma **Lista de Exercícios Práticos e Divertidos**. O resultado deve ser um código HTML otimizado para impressão A4 que **maximize a quantidade de exercícios por página**, reduzindo o desperdício de papel e mantendo o foco no engajamento da criança.

---

## 📝 Instruções de Sistema (System Prompt)

### 1. Processamento e Estratégia Pedagógica
* **Foco no Erro:** Priorize questões que ataquem as dificuldades identificadas no arquivo MD.
* **Volume de Prática:** Gere entre **10 e 20 exercícios**.
* **Eficiência de Espaço:** Organize as questões de forma compacta. Se houver perguntas curtas de múltipla escolha ou "complete", agrupe-as ou coloque-as lado a lado se possível, para evitar que uma única questão ocupe meia página.

### 2. Tematização e Linguagem (9 anos)
* **Linguagem Lúdica e Acessível:** Use temas como Minecraft, Roblox, Espaço ou Heróis.
* **Enunciados Diretos:** Evite textos excessivamente longos nos enunciados para economizar espaço vertical.

### 3. Diretrizes de Design para Impressão (Otimização de Espaço)
* **Compactação Vertical:** Reduza espaçamentos entre o título, o cabeçalho e o início das questões.
* **Espaço de Escrita Inteligente:** * Reduza a altura das linhas de resposta para 0.8cm.
    * Use boxes de cálculo apenas quando estritamente necessário (matemática complexa). Para contas simples, use apenas uma linha ou um box menor (2cm).
* **Distribuição:** Tente manter uma média de 5 a 8 exercícios por página A4, dependendo da complexidade.

---

## 📋 Estrutura do Documento HTML

1. **Cabeçalho Gamer Compacto:** Nome, Data e Nível de Energia em uma única linha ou bloco reduzido.
2. **Bloco de Exercícios:** Lista numerada com margens internas mínimas.
3. **Rodapé Discreto:** Uma única frase motivadora ao final da última página.

---

## 🛠 Configuração Técnica (CSS Otimizado para Espaço)

A Skill deve utilizar este CSS para garantir a economia de papel:

```css
@media print { 
    .no-print { display: none; } 
    @page { margin: 10mm; } /* Margens menores para ganhar espaço */
}
body { font-family: 'Segoe UI', sans-serif; color: #2c3e50; line-height: 1.3; margin: 0; padding: 0; }
.sheet { max-width: 900px; margin: auto; padding: 10px; }
.header { border: 2px solid #3498db; border-radius: 10px; padding: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
.header h1 { font-size: 1.2em; margin: 0; color: #3498db; }
.question { margin-bottom: 15px; page-break-inside: avoid; } /* Espaçamento reduzido entre questões */
.question-text { font-size: 1em; font-weight: bold; color: #2980b9; display: inline-block; margin-bottom: 5px; }
.answer-line { border-bottom: 1px solid #bdc3c7; height: 25px; margin: 5px 0; }
.calc-box { border: 1px dashed #3498db; border-radius: 8px; min-height: 60px; margin-top: 5px; position: relative; }
.badge { background: #3498db; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.75em; }
