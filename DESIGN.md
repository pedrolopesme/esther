# DESIGN.md

## Direção visual

A Esther usa uma linguagem **Kawaii Premium**: alegre, acolhedora e expressiva, mas com acabamento consistente de produto. A interface deve parecer um brinquedo digital bem cuidado — colorido o suficiente para convidar uma criança de 9 anos, organizado o suficiente para não distrair da aprendizagem.

Princípios:

- **Acolher antes de cobrar:** mensagens positivas, linguagem simples e estados de erro sem punição visual.
- **Brincar para orientar:** stickers, estrelas, ícones e microanimações reforçam hierarquia e progresso.
- **Profundidade macia:** claymorphism, glassmorphism leve e sombras difusas criam objetos palpáveis.
- **Uma ação principal por vez:** o botão de verificar/avançar deve ser evidente e fácil de tocar.
- **Feedback imediato:** seleção, acerto, erro, progresso e conclusão precisam ter estados visuais claros.
- **Consistência por matéria:** cada matéria tem uma cor e um ícone próprios, mas usa os mesmos componentes.

## Paleta

As cores oficiais estão declaradas no `@theme` de `src/app/globals.css`:

| Token | Hex | Uso |
|---|---|---|
| `candy` | `#FF70A6` | Rosa chiclete; ação principal, Matemática |
| `lilac` | `#A370FF` | Lilás mágico; navegação, Português |
| `sun` | `#FFD166` | Amarelo sol; estrelas, História, dicas |
| `mint` | `#06D6A0` | Menta energética; acerto, Geografia |
| `sky` | `#4CC9F0` | Azul céu; progresso, Inglês |
| `coral` | `#FF9770` | Coral; Ciências, alertas suaves |
| `ink` | `#4A2B52` | Texto principal em ameixa escura |
| `ink-soft` | `#8A6B92` | Texto secundário |
| `cream` | `#FFF7FC` | Superfícies clay |
| `cloud` | `#FFFFFF` | Cards, controles e destaques |

### Identidade das matérias

O registro oficial fica em `src/utils/subjects.js`. Não crie uma segunda fonte de verdade.

| Matéria | Cor | Ícone | Sticker |
|---|---|---|---|
| Matemática | candy | `Calculator` | 🔢 |
| Português | lilac | `BookOpenText` | 📚 |
| Inglês | sky | `Languages` | 🇺🇸 |
| Geografia | mint | `Globe2` | 🌍 |
| História | sun | `Landmark` | 📜 |
| Ciências | coral | `Microscope` | 🔬 |

## Tipografia

- **Família principal:** Fredoka, carregada por `next/font/google` no layout.
- **Títulos:** `font-display`, pesos 600–700, tamanhos generosos e line-height confortável.
- **Texto auxiliar:** peso 400–500, `ink-soft`, nunca abaixo de contraste legível.
- **Botões e badges:** Fredoka semibold/bold; linguagem curta e orientada à ação.
- Evite misturar fontes ou usar caixa alta longa: a interface deve continuar macia e amigável.

## Forma e profundidade

- Cards principais: `rounded-[2rem]` através de `--radius-blob`.
- Controles e badges: entre `rounded-xl` e `rounded-full`.
- Superfície clay: classe `.clay`, com `--shadow-clay` e borda branca translúcida.
- Superfície glass: classe `.glass`, com fundo branco translúcido, `backdrop-blur` e borda clara.
- Botões: sombra inferior colorida de 5–6px; no `:active`, remover a sombra e deslocar o botão para baixo.
- Não empilhe sombras pesadas em cada elemento: profundidade deve formar grupos, não ruído.

## Componentes

Os primitives compartilhados vivem em `src/components/ui/`:

- `Button`: ações com variantes `candy`, `lilac`, `mint`, `sky`, `sun`, `coral` e `ghost`.
- `Card`: superfície clay para conteúdo agrupado.
- `Badge`: metadados em formato pill com tons por matéria/estado.
- `ProgressBar`: progresso horizontal com gradiente, shimmer e knob de estrela.
- `Option`: opção de resposta grande e touch-friendly.
- `PlayerBadge`: avatar, nível, progresso de nível e contador de estrelas.
- `Sticker`: decoração puramente visual; nunca deve carregar informação essencial.

### Estados de resposta

`Option` precisa distinguir visualmente:

1. **Idle:** branco, borda suave, sombra baixa.
2. **Hover/focus:** levitação mínima e ring de foco visível.
3. **Selected:** lilás, ponto branco no rádio e sombra mais profunda.
4. **Correct:** menta, ícone de check e feedback positivo.
5. **Incorrect:** rosa/coral, ícone de X e indicação da resposta correta.
6. **Locked:** cursor neutro depois da verificação.

## Layouts

### Header

Header sticky, centralizado em um pill glass de largura máxima `max-w-5xl`. Deve conter:

- Logo Esther com ícone de sparkle.
- `PlayerBadge` alinhado à direita.
- Área de toque confortável em todos os elementos interativos.

### Homepage

1. Hero com label de aventura, título em gradiente e stickers flutuantes.
2. Grid de cartas colecionáveis de matérias.
3. Lista de novidades com ícone, matéria, data, número de questões e affordance de navegação.

Cards de matéria devem ter:

- faixa superior em gradiente da matéria;
- emoji/sticker no canto;
- ícone dentro de medalhão branco;
- nome, tag curta e ação `Jogar`;
- levitação e rotação mínima no hover.

### Página de matéria

- Link de retorno em pill.
- Hero colorido da matéria com ícone e tag.
- Filtros agrupados em superfície clara.
- Listas em cards grandes, com descrição limitada, badges de ano/data e seta de navegação.
- Entrada staggered; nunca esconder conteúdo sem fallback.

### Página de exercício

- Hero da lista com matéria, título, descrição e metadados.
- Indicador `Exercício X de Y`, estrela de pontuação e barra de progresso.
- Card de pergunta com contraste alto.
- Opções grandes, espaçadas e confortáveis para toque.
- Botão `Verificar` como ação primária.
- Tela de conclusão com troféu, estrelas, resumo e revisão de erros.

## Movimento

Framer Motion é usado para orientar, não para distrair:

- Entrada de páginas: fade + deslocamento curto.
- Cards: spring com levitação de até 10px e rotação de até 1.5°.
- Listas: stagger curto entre 0.06s e 0.1s.
- Mudança de exercício: transição horizontal curta com `AnimatePresence`.
- Feedback: scale/pop suave.
- Celebração: `canvas-confetti` apenas ao completar; respeitar `prefers-reduced-motion`.

Evite animações contínuas em grande quantidade. Stickers podem flutuar, mas texto, filtros e respostas devem permanecer estáveis.

## Acessibilidade e responsividade

- Contraste sempre deve ser suficiente entre texto e fundo pastel.
- Não use cor como único indicador: combine texto, ícone ou forma.
- Botões e opções devem ter área de toque aproximada de 44px ou maior.
- Focus rings devem permanecer visíveis.
- Teste em largura de celular, tablet e notebook.
- O conteúdo deve continuar compreensível com animações reduzidas ou desativadas.

## Checklist visual

Antes de finalizar uma mudança de UI:

- [ ] Usa tokens e temas existentes, sem cor solta desnecessária.
- [ ] O estado hover/focus/active/disabled é visível.
- [ ] Texto e controles permanecem legíveis sobre degradês.
- [ ] Não existe conteúdo essencial escondido por `whileInView` sem fallback.
- [ ] O layout funciona em celular e tablet.
- [ ] A mudança foi verificada no browser real, não apenas no build.
- [ ] Imagens, sons, JSON e scripts continuam usando o base path do GitHub Pages.
