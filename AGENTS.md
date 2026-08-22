# AGENTS.md

## Contexto do projeto

Esther é uma plataforma de exercícios escolares para crianças do Ensino Fundamental. O produto combina listas de exercícios, feedback imediato, pontuação persistente e uma interface gamificada Kawaii Premium.

Site publicado: <https://pedrolopesme.github.io/esther/>

## Stack

- Next.js 15 com App Router
- React 19
- Export estático (`output: "export"`)
- Tailwind CSS 4 via `@tailwindcss/postcss`
- Framer Motion para animações
- Lucide React para ícones
- `canvas-confetti` para celebrações
- `clsx` + `tailwind-merge` através de `src/utils/cn.js`
- JSON estático em `public/data/`

## Estrutura relevante

- `src/app/`: rotas, layout global e páginas
- `src/components/ui/`: primitives visuais reutilizáveis
- `src/components/`: componentes de domínio, como exercícios e páginas compartilhadas
- `src/hooks/`: hooks de comportamento, incluindo sons
- `src/utils/`: carregamento de dados, temas de matérias e helpers
- `public/data/`: listas de exercícios e catálogos `index.json`
- `public/`: sons e demais assets estáticos
- `docs/screenshots/`: imagens usadas na documentação
- `.github/workflows/deploy.yml`: deploy automático no GitHub Pages

## Regras de implementação

1. **Preserve a lógica dos exercícios.** Não altere silenciosamente o contrato dos JSONs, a pontuação, o registro de erros, os sons ou o fluxo de feedback.
2. **Use os primitives existentes.** Para novos elementos visuais, prefira `src/components/ui/` antes de criar CSS ou markup paralelo.
3. **Consulte o design system.** Cores, tipografia, sombras, estados e animações devem seguir [DESIGN.md](DESIGN.md) e `src/app/globals.css`.
4. **Centralize temas de matérias.** Use `src/utils/subjects.js`; não replique arrays de cores, ícones ou emojis nas páginas.
5. **Use `cn()` para classes condicionais.** Evite concatenação manual de classes Tailwind quando houver estados ou variantes.
6. **Mantenha acessibilidade.** Use elementos semânticos, foco visível, labels associados, áreas de toque confortáveis e `aria-*` quando necessário.
7. **Respeite movimento reduzido.** Animações decorativas não podem ser essenciais para entender ou usar a interface.
8. **Assets precisam respeitar o GitHub Pages.** URLs de imagens, sons e JSON devem passar por `assetPath()` quando forem referenciadas no client.
9. **Não use servidor em runtime.** O site precisa continuar funcionando como export estático; não reintroduza API routes baseadas em filesystem.
10. **Evite duplicação.** Se seis páginas têm o mesmo comportamento, extraia um componente compartilhado e deixe wrappers finos por matéria.

## Dados de exercícios

Cada matéria possui um catálogo em `public/data/<materia>/index.json`. Os exercícios individuais ficam no mesmo diretório. A página inicial usa `public/data/latest.json`.

Ao adicionar ou editar uma lista:

1. Valide o JSON.
2. Atualize o `index.json` da matéria.
3. Atualize `public/data/latest.json` se a lista puder aparecer entre as novidades.
4. Verifique a rota da matéria e a rota individual da lista.

## Comandos

```bash
npm install       # instala dependências
npm run dev       # desenvolvimento em localhost:3000
make build        # build estático local em out/
make run          # build local + serve de out/
make build-prod   # build com NEXT_PUBLIC_BASE_PATH=/esther
make test         # lint configurado no projeto
```

Antes de concluir uma alteração relevante:

- rode `npm run build` ou o build específico do ambiente;
- para mudanças visuais, verifique a aplicação renderizada no browser;
- para mudanças de exercícios, teste seleção, verificação, feedback, avanço e conclusão;
- confira que o caminho `/esther/` continua funcionando no build de produção.

## GitHub Pages

Pushes em `main` executam `.github/workflows/deploy.yml`. O build de produção usa:

```text
NEXT_PUBLIC_BASE_PATH=/esther
```

Não publique a pasta `out/` no Git. Ela é um artefato gerado pelo build.

## Estilo de código

- Prefira componentes pequenos, explícitos e reutilizáveis.
- Mantenha nomes de componentes em PascalCase.
- Use aspas e formatação já adotadas pelo arquivo que está sendo alterado.
- Remova código morto e primitives antigos quando houver uma migração completa.
- Comentários devem explicar decisões ou invariantes, não repetir o código.
