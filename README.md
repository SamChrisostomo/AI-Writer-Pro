# AI-Writer-Pro ✍️

O **AI-Writer-Pro** é uma plataforma moderna e poderosa de auxílio à escrita, desenvolvida para ajudar criadores de conteúdo, escritores e profissionais a alcançarem novos patamares de produtividade e qualidade através da Inteligência Artificial.

## ✨ Funcionalidades

- **Escritor AI**: Interface intuitiva para geração de conteúdo em tempo real.
- **Agentes Customizados**: Crie e gerencie personas de IA com prompts específicos para diferentes tons e estilos.
- **Painel de Controle**: Gerencie suas gerações passadas e acompanhe seu progresso.
- **Exportação Flexível**: Exporte seus textos diretamente para formatos populares como `.docx` e `.pdf`.
- **Interface Premium**: Design elegante e funcional utilizando Radix UI e Tailwind CSS 4.

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15 (App Router), React 19
- **Estilização**: Tailwind CSS 4, Radix UI, Framer Motion
- **Banco de Dados & Auth**: Supabase, PostgreSQL, Drizzle ORM
- **Performance**: Upstash Redis (Rate Limiting)
- **IA**: Google Gemini API & OpenAI SDK

## 🚀 Como Começar

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/AI-Writer-Pro.git
   cd AI-Writer-Pro
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` baseado no `.env.example` e preencha as chaves:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## 📖 Guia de Desenvolvimento

Para informações detalhadas sobre a arquitetura do projeto e como contribuir utilizando IA, consulte o arquivo [context.md](./context.md).

---
Desenvolvido com ❤️ para potencializar a criatividade.
