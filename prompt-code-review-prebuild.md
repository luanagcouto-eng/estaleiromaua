# 🤖 Prompt — Code Review Pré-Build

> Cole este prompt na IA conectada ao seu repositório.
> Substitua os campos entre `[ ]` antes de enviar.

---

```
Você é um engenheiro de software sênior realizando um code review pré-build completo.

Você tem acesso ao código-fonte deste projeto. Analise o repositório e audite cada item abaixo.

## REGRAS DE OUTPUT

Para cada item auditado, retorne EXATAMENTE neste formato:

✅ PASS   — [item] — [evidência direta no código, ex: arquivo:linha]
❌ FAIL   — [item] — [problema encontrado + arquivo:linha se aplicável]
⚠️ WARN   — [item] — [implementado parcialmente ou não verificável estaticamente]
➖ N/A    — [item] — [não se aplica a esta stack/projeto]

Ao final, gere:
1. RESUMO com contagem: PASS / FAIL / WARN / N/A
2. PRIORIDADE DE CORREÇÃO: liste os FAILs ordenados por severidade (Critical > High > Medium > Low)
3. PLANO DE AÇÃO: para cada FAIL crítico ou high, sugira a correção mínima com exemplo de código

Seja direto. Sem introduções. Sem repetir o enunciado. Foque em evidências no código.

---

## CONTEXTO DO PROJETO

- Stack: [ex: Next.js 14, Supabase, TypeScript, Tailwind]
- Ambiente alvo: [ex: produção na Vercel + Supabase cloud]
- Autenticação: [ex: Supabase Auth com Google OAuth]
- Banco: [ex: PostgreSQL via Supabase]
- Deploy: [ex: Vercel com GitHub Actions]

---

## CHECKLIST DE AUDITORIA

### 1. FRONTEND
- Bundle size: há análise configurada (next-bundle-analyzer, vite-plugin-visualizer)?
- Code splitting: rotas usam lazy loading / dynamic import?
- Imagens: componente `<Image>` ou `loading="lazy"` + formato moderno (WebP/AVIF)?
- Fontes: `font-display: swap` configurado? Preload nas fontes críticas?
- Cache de assets: headers `Cache-Control: max-age=31536000` para assets com hash?
- SEO: cada página tem `<title>` único, `<meta description>`, Open Graph e canonical?
- Responsividade: breakpoints cobrem mobile / tablet / desktop?
- Acessibilidade: imagens têm `alt`, inputs têm `label`, foco visível, `aria-*` onde necessário?
- Estados de UI: loading, error e empty state implementados em todos os fluxos de dados?
- Formulários: validação client-side com feedback de erro visível?
- Páginas de erro: 404 e 500 customizadas?
- `console.log` em produção: há chamadas não removidas no código?
- Arquivos estáticos: `favicon`, `robots.txt`, `sitemap.xml` presentes?

### 2. APIs & BACKEND LOGIC
- Versioning: endpoints seguem `/api/v1/` ou equivalente?
- Error response: formato padronizado e consistente em todos os endpoints?
- Validação server-side: inputs validados no servidor (Zod, Joi, Yup, etc.)?
- Separação de camadas: lógica de negócio fora de componentes de UI?
- Timeouts: chamadas externas têm timeout configurado?
- Retry: integrações críticas têm retry com backoff exponencial?
- Circuit breaker / fallback: dependências externas têm fallback?
- Webhooks: assinatura HMAC validada antes de processar payload?
- Paginação: listagens implementam cursor ou offset?
- Over-fetching: APIs retornam apenas os campos necessários?

### 3. DATABASE & STORAGE
- Migrações: versionadas com rollback (`up`/`down`)?
- Schema: consistente com o código atual?
- Índices: colunas em `WHERE`, `JOIN`, `ORDER BY` têm índice?
- N+1 queries: há queries dentro de loops ou carregamento sem eager loading?
- Query timeout: configurado?
- Connection pooling: `min`, `max`, `idleTimeout` definidos?
- Dados sensíveis: criptografados em repouso?
- Storage de arquivos: buckets com ACL restritivo (sem público por padrão)?
- Credenciais hardcoded: há strings de conexão no código-fonte?

### 4. AUTH & PERMISSIONS
- JWT: tokens têm expiração definida? Refresh token implementado?
- Logout: token invalidado no servidor (blocklist ou short TTL)?
- Autorização: cada rota/recurso protegido por verificação de role?
- RLS: Row-Level Security ativo no banco? Políticas testadas por role?
- Brute force: proteção no endpoint de login (lockout, rate limit, captcha)?
- OAuth scopes: apenas scopes mínimos solicitados?
- Reset de senha: token de uso único com expiração curta?
- Menor privilégio: serviços e usuários têm apenas as permissões necessárias?

### 5. HOSTING & DEPLOYMENT
- Variáveis de ambiente: secrets em variáveis de ambiente, não em arquivos commitados?
- `.env` commitado: há arquivo `.env` com valores reais no repositório?
- Health check: endpoint `/health` ou `/ping` implementado?
- Rollback: há estratégia definida?
- Docker (se aplicável): imagem usa usuário não-root? Base image slim? `.dockerignore` correto?
- HTTPS: redirecionamento HTTP → HTTPS configurado?

### 6. CI/CD & VERSION CONTROL
- Pipeline: sequência lint → test → build → security scan → deploy?
- Branch protection: merge bloqueado se CI falhar?
- Secrets no CI: variáveis sensíveis expostas em logs?
- Commits diretos na main: há histórico de push direto sem PR?
- Padrão de commit: Conventional Commits ou equivalente seguido?

### 7. SECURITY
- Headers HTTP: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` configurados?
- XSS: inputs renderizados com escape? `dangerouslySetInnerHTML` usado sem sanitização?
- CSRF: proteção implementada em mutations?
- SQL Injection: queries usam prepared statements / ORM parametrizado?
- IDOR: autorização verifica ownership do recurso antes de retornar/modificar?
- CORS: `Access-Control-Allow-Origin: *` em produção?
- Dependências: `npm audit` ou equivalente sem vulnerabilidades high/critical?
- Dados sensíveis em logs: senhas, tokens, CPF, dados de cartão aparecem em logs?
- RLS entre tenants: um usuário pode acessar dados de outro tenant?

### 8. RATE LIMITING
- Rate limit global: configurado por IP?
- Endpoints sensíveis: login, reset senha, OTP, upload têm rate limit específico?
- Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` retornados?
- Status code: `429 Too Many Requests` retornado corretamente?
- Distribuído: rate limiting funciona com múltiplas instâncias (Redis/Upstash)?

### 9. CACHING & CDN
- CDN: assets estáticos servidos via CDN?
- Cache-Control: headers corretos por tipo de recurso?
- Dados sensíveis em cache: respostas com dados de usuário têm `no-store`?
- Invalidação: estratégia de purge definida para deploys?

### 10. LOAD BALANCING & SCALING
- Stateless: a aplicação pode escalar horizontalmente sem perda de estado?
- Sessões: state armazenado externamente (Redis) e não em memória local?
- Graceful shutdown: aplicação drena conexões antes de terminar?
- Banco multi-instância: connection pooler configurado (PgBouncer, Supabase pooler)?

### 11. ERROR TRACKING & LOGS
- Error tracking: Sentry ou equivalente configurado e capturando erros?
- Logs estruturados: JSON com `timestamp`, `level`, `service`, `traceId`?
- Log level em prod: DEBUG desabilitado em produção?
- Trace ID: propagado entre serviços/requests?
- Alertas: notificações configuradas para erros críticos?

### 12. AVAILABILITY & RECOVERY
- Health check: monitora subsistemas (banco, cache, serviços externos)?
- Backup: configurado e restore já foi testado?
- Uptime monitoring: serviço externo monitorando disponibilidade?
- Runbook: documentação de resposta a incidentes existe?

---

Comece a auditoria agora. Analise o código e retorne o relatório completo no formato especificado.
```
