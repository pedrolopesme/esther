# Esther — exercícios escolares com cara de jogo

> **Vamos estudar juntas?** A Esther transforma a revisão para as provas em uma aventura curta, colorida e cheia de feedback imediato.

🌐 **Acesse agora:** [pedrolopesme.github.io/esther](https://pedrolopesme.github.io/esther/)

A Esther é uma plataforma de exercícios escolares para crianças do Ensino Fundamental. A criança escolhe uma matéria, resolve uma lista, recebe feedback na hora e acompanha sua pontuação — sem planilhas assustadoras e sem perder a diversão.

## ✨ O que tem por aqui

- 📚 **Seis matérias:** Matemática, Português, Inglês, Geografia, História e Ciências
- 🎯 **Listas de exercícios** organizadas por matéria e data
- 🧠 **Exercícios interativos** com múltipla escolha, verdadeiro ou falso, preenchimento e outros formatos
- 💬 **Dicas e feedback imediato** para aprender com cada resposta
- 📈 **Barra de progresso** para saber quanto falta
- 🏆 **Pontuação persistente** no navegador
- 🔊 **Efeitos sonoros** para acertos, erros e conclusão de listas
- 📱 **Layout responsivo** para computador, tablet e celular
- 🌈 **Visual inspirado em jogos de aprendizagem**, com bastante cor e incentivo

## 🖼️ Espiadinha da Esther

### Página inicial

![Página inicial da Esther](docs/screenshots/home.webp)

### Escolha uma lista

![Listas de exercícios de Matemática](docs/screenshots/matematica.webp)

### Hora de responder

![Exercício interativo de Matemática](docs/screenshots/exercicio.webp)

## 📘 Guias do projeto

- [AGENTS.md](AGENTS.md) — contexto técnico, regras de contribuição, comandos e checklist de validação
- [DESIGN.md](DESIGN.md) — direção visual Kawaii Premium, tokens de cor, tipografia, componentes e estados de interação

Consulte esses dois arquivos antes de alterar a arquitetura ou a experiência visual da Esther.


## 🚀 Rodando localmente

### Pré-requisitos

- Node.js 20 ou superior
- npm

### Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Build estático local

A Esther é exportada como site estático para funcionar no GitHub Pages:

```bash
make run
```

Esse comando executa o build local e serve a pasta `out/` em [http://localhost:3000](http://localhost:3000).

Também é possível executar os comandos separadamente:

```bash
make build  # gera out/ para uso local
make test   # executa a verificação configurada no projeto
```

Para simular o build usado no GitHub Pages:

```bash
make build-prod
```

## 🧩 Como os dados funcionam

As listas de exercícios ficam no Supabase, na tabela `public.exercise_lists`. A SPA consulta diretamente o banco com a chave pública e só recebe listas com `published = true`. O catálogo por matéria, as novidades da página inicial e o conteúdo das listas usam a mesma fonte de dados.

O schema e as políticas de segurança ficam versionados em `supabase/migrations/`. A carga inicial das listas que antes estavam em `public/data/` já foi realizada no projeto Supabase configurado para a Esther.

### Configuração local

Copie `.env.example` para `.env.local` e preencha as credenciais públicas do projeto:

```bash
cp .env.example .env.local
```

Variáveis necessárias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou uma chave `sb_publishable_...`)

### Painel administrativo

Acesse `/admin` e entre com uma conta criada no Supabase Auth. A primeira conta autenticada pode reivindicar a administração quando ainda não existe nenhum registro em `admin_users`; as contas seguintes precisam ser adicionadas como administradoras pelo banco.

O painel permite criar, editar, publicar, despublicar e excluir listas. O campo de exercícios aceita um array JSON usando os tipos `multiple-choice`, `fill-gap` e `true-false`, com `options` e `correctIndex`.

## 🛠️ Tecnologias

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Framer Motion](https://motion.dev/)
- Supabase (Postgres, Auth e Row Level Security)
- GitHub Actions + GitHub Pages para publicação

## 📦 Estrutura principal

```text
.
├── public/
│   ├── data/                 # dados legados usados apenas para a carga inicial
│   └── *.mp3                # sons de feedback
├── src/
│   ├── app/                  # páginas e rotas do Next.js
│   ├── components/           # componentes visuais e exercícios
│   ├── hooks/                # comportamentos reutilizáveis
│   └── utils/                # carregamento de dados e assets
├── docs/screenshots/         # screenshots usadas nesta documentação
├── AGENTS.md                 # guia técnico para agentes e contribuidores
├── DESIGN.md                 # guia do design system e da experiência visual
├── .github/workflows/        # deploy automático no GitHub Pages
├── Makefile
└── next.config.mjs
```

## 🌍 Publicação no GitHub Pages

Cada push na branch `main` dispara o workflow de deploy:

1. O GitHub instala as dependências.
2. O Next.js gera o export estático em `out/`.
3. O artefato é publicado no GitHub Pages.

O workflow usa `NEXT_PUBLIC_BASE_PATH=/esther` e injeta as variáveis públicas do Supabase durante o build. Cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` como **Actions variables** no repositório do GitHub antes do primeiro deploy:

```text
https://pedrolopesme.github.io/esther/
```

## 💌 Ideias para a próxima fase

- Criar mais tipos de exercícios e desafios-relâmpago
- Adicionar conquistas e sequência diária de estudos
- Permitir imagens e áudio dentro das questões
- Criar uma área para professores montarem listas
- Melhorar acessibilidade e suporte a leitura em voz alta

Feito com carinho para transformar **“preciso estudar”** em **“só mais uma questão!”** 💖
