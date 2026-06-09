# Metas Mauá 2026

Sistema web de **gestão de metas corporativas** do Estaleiro Mauá, construído com Next.js, Supabase e Tailwind CSS.

🌐 **Produção:** https://estaleiromaua-eight.vercel.app

---

## Visão geral

A aplicação permite que líderes e gestores do Estaleiro Mauá acompanhem, lancem e auditem o progresso das metas anuais e trimestrais de cada diretoria, com evidências obrigatórias por lançamento.

### Papéis (roles)

| Role | Páginas acessíveis |
|------|-------------------|
| CEO | Visão Geral · Minha Equipe · Relatórios · Atualização de Metas |
| Diretor | Visão Geral · Minha Equipe · Relatórios · Atualização de Metas |
| Gestor | Visão Geral · Atualização de Metas |
| Admin | Todas as páginas + Criação de Metas · Usuários · Auditoria |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Auth | Supabase Auth (Google OAuth, domínio `@estaleiromaua.ind.br`) |
| Banco de dados | Supabase PostgreSQL com Row Level Security (RLS) |
| Deploy | Vercel (CD automático via push em `main`) |
| Analytics | Vercel Analytics |

---

## Funcionalidades

### Visão Geral (`/overview`)
- Organograma interativo com 5 diretorias
- Fill gamificado: cada caixa se preenche de baixo para cima conforme o % de atingimento
- Legenda de 3 faixas: 🔴 0–33% · 🟡 33–66% · 🟢 66–100%
- Clique em qualquer diretoria para abrir painel lateral com:
  - Progresso consolidado
  - Lista de metas individuais com % de atingimento e barra de progresso
  - Subdepartamentos vinculados

### Atualização de Metas (`/my-goals`)
- Filtro por período: Todas · Anual · T1 · T2 · T3 · T4
- Indicador visual do trimestre atual (lançamento obrigatório)
- Painel de alertas: metas pendentes de lançamento
- Tabela expansível: histórico de lançamentos por meta
- Dialog de lançamento com:
  - Valor atingido
  - Memória de cálculo (mínimo 10 caracteres)
  - Evidência **obrigatória** — upload de arquivo (PNG/JPG/PDF, máx 10 MB) ou URL

### Minha Equipe (`/team`)
- Visão de líderes subordinados e seus respectivos progressos

### Relatórios (`/reports`)
- Tabela consolidada de todas as metas com filtro por período
- Exportação CSV e impressão PDF

### Criação de Metas (`/admin/goals`) — Admin only
- Formulário completo: título, descrição, período, meta, unidade, peso, responsável e departamento

### Usuários (`/admin/users`) — Admin only
- CRUD de perfis de colaboradores
- Suporte a **perfis placeholder**: criados pelo admin antes do primeiro login do colaborador; vinculação automática via e-mail no primeiro login Google

### Auditoria (`/admin/audit`) — Admin only
- Trilha de auditoria automática via triggers PostgreSQL
- Registra INSERT/UPDATE/DELETE em `goals` e `goal_history`
- Filtro por tipo de entidade (Meta / Lançamento)
- Visualização expandida de dados antes/depois em JSON

---

## Banco de dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários (role, departamento, superior) |
| `departments` | Hierarquia de departamentos |
| `goals` | Metas com período, peso, meta e valor atual |
| `goal_history` | Lançamentos de resultados com evidências |
| `audit_log` | Trilha de auditoria automática |

### Views materializadas

| View | Descrição |
|------|-----------|
| `org_chart_progress` | Progresso por departamento (% ponderado) |
| `company_progress` | Progresso consolidado da empresa |

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. As políticas garantem:
- Usuários veem apenas suas próprias metas (`owner_id = auth.uid()`)
- Admin e CEO têm acesso total
- Diretores e gestores têm acesso às metas de sua diretoria via políticas customizadas

---

## Desenvolvimento local

### Pré-requisitos
- Node.js 20+
- Conta Supabase com o projeto configurado

### Setup

```bash
# 1. Clone o repositório
git clone https://github.com/luanagcouto-eng/estaleiromaua.git
cd estaleiromaua

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000.

### Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

---

## Deploy

O deploy é automático via Vercel a cada push na branch `main`. Não há etapa manual necessária.

---

## Estrutura de pastas

```
app/
├── (authenticated)/        # Rotas protegidas (layout com sidebar)
│   ├── overview/           # Visão Geral — organograma
│   ├── my-goals/           # Atualização de Metas
│   ├── team/               # Minha Equipe
│   ├── reports/            # Relatórios
│   └── admin/
│       ├── goals/          # Criação de Metas (admin)
│       ├── users/          # Gestão de Usuários (admin)
│       └── audit/          # Auditoria (admin)
├── login/                  # Página de login
└── auth/callback/          # Callback OAuth Supabase
components/
├── layout/app-sidebar.tsx  # Sidebar com navegação por role
└── alerts/                 # Painel de alertas de metas
lib/
├── actions/                # Server Actions (auth, goals, users)
├── schemas/                # Validações Zod
└── supabase/               # Clientes Supabase (server/client)
```

---

## Suporte

Em caso de dúvidas ou erros, entre em contato com o time de TI do Estaleiro Mauá.
