# Contexto do Projeto: AI-Writer-Pro (ai-studio-applet)

Este documento fornece o contexto necessário para guiar uma IA no desenvolvimento e manutenção do projeto AI-Writer-Pro.

## 🚀 Visão Geral
O **AI-Writer-Pro** é uma plataforma de auxílio à escrita baseada em IA, permitindo que usuários gerem, gerenciem e exportem conteúdos de alta qualidade.

## 🛠️ Stack Tecnológica
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 4
- **Componentes**: Radix UI + Shadcn (Arquitetura Atomic Design)
- **Banco de Dados**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Autenticação**: Supabase Auth (SSR)
- **IA**: Google Generative AI (@google/genai) & OpenAI
- **Rate Limiting**: Upstash Redis (@upstash/ratelimit)
- **Exportação**: docx, jspdf

## 📂 Estrutura de Pastas Úteis
- `/app`: Rotas e páginas (Next.js App Router).
  - `/app/api`: Endpoints da API.
  - `/app/writer`: Interface principal do escritor.
  - `/app/dashboard`: Painel do usuário.
- `/components`: Componentes seguindo Atomic Design (`atoms`, `molecules`, `organisms`, `templates`).
- `/lib`: Utilitários, configurações de DB e esquemas.
  - `schema.ts`: Definições das tabelas `users`, `agents` e `chats`.
- `/hooks`: Hooks React customizados.

## 💾 Modelo de Dados (Drizzle)
- **users**: Perfis de usuário e preferências.
- **agents**: Prompts customizados (instruções de sistema) criados pelos usuários.
- **chats**: Histórico de gerações e interações.

## 🔐 Segurança e Performance
- **Middleware**: Rotas `/dashboard`, `/writer` e `/settings` são protegidas.
- **Rate Limit**: Implementado via Upstash Redis (limite de 5 envios por minuto por padrão).

## 🎨 Padrões de Desenvolvimento
- **Atomic Design**: Mantenha a separação clara entre componentes de differentes níveis.
- **Server Components**: Use React Server Components (RSC) sempre que possível.
- **Tailwind 4**: Utilize as novas funcionalidades do Tailwind 4.
- **Tipagem**: TypeScript estrito é obrigatório.

## 🤖 Orientações para a IA
1. **Contexto de Escrita**: Ao sugerir melhorias no `writer`, foque na experiência do usuário e na qualidade do prompt enviado às APIs de IA.
2. **Novos Componentes**: Siga o padrão Atomic Design já estabelecido em `/components`.
3. **Segurança**: Sempre verifique se as operações de banco de dados estão vinculadas ao `userId` do usuário autenticado via Supabase.
