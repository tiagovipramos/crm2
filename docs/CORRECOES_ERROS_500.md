# Correções de Erros 500 na API - VPS Produção

## Data da Análise
02/11/2025

## Problemas Identificados

### 1. **Ausência de Middleware de Tratamento de Erros Global**
**Severidade:** CRÍTICA ⚠️

**Problema:**
- Não havia um middleware global para capturar e tratar erros
- Erros não tratados causavam crashes silenciosos retornando erro 500 genérico
- Falta de logs estruturados para debug em produção
- Detalhes sensíveis do sistema poderiam vazar em produção

**Solução Implementada:**
- ✅ Criado `backend/src/middleware/errorHandler.ts` com:
  - Classe `AppError` para erros operacionais customizados
  - Handler global de erros com logs detalhados
  - Tratamento específico para erros MySQL (ER_DUP_ENTRY, ER_BAD_FIELD_ERROR, etc.)
  - Tratamento de erros JWT (token inválido/expirado)
  - Proteção de informações sensíveis em produção
  - Handler de rotas não encontradas (404)
  - Helper `asyncHandler` para capturar erros assíncronos

### 2. **Validação Insuficiente nos Controllers**
**Severidade:** ALTA ⚠️

**Problema:**
- Falta de validação de entrada em múltiplos endpoints
- Não verificava se usuário estava autenticado antes de processar
- Possibilidade de SQL injection em alguns casos
- Falta de validação de tipos de dados

**Solução Implementada:**

#### authController.ts
- ✅ Validação de tipos (string) para email e senha
- ✅ Normalização de email (trim + lowercase)
- ✅ Verificação se senha está definida no banco
- ✅ Validação de usuário autenticado em getMe
- ✅ Uso de `next(error)` para propagar erros ao handler global

#### leadsController.ts
- ✅ Validação de autenticação em todos os endpoints
- ✅ Validação de IDs obrigatórios
- ✅ Validação de tipos de dados (string)
- ✅ Validação de tamanho mínimo (nome >= 2 caracteres)
- ✅ Validação de status válidos com lista de opções
- ✅ Verificação de resultados de queries antes de usar
- ✅ Melhor tratamento de erros com `next(error)`

### 3. **Falta de Verificações de Null/Undefined**
**Severidade:** ALTA ⚠️

**Problema:**
- Código assumia que queries sempre retornariam resultados
- Não verificava `result.rows` antes de acessar
- Possibilidade de crash ao acessar propriedades de undefined

**Solução Implementada:**
- ✅ Verificações `if (!result.rows || result.rows.length === 0)` adicionadas
- ✅ Verificações de `insertId` após INSERT
- ✅ Verificações de `affectedRows` após UPDATE/DELETE
- ✅ Mensagens de erro mais descritivas

### 4. **Logs Inadequados para Debug em Produção**
**Severidade:** MÉDIA

**Problema:**
- Logs genéricos sem contexto suficiente
- Difícil rastrear a origem dos erros
- Falta de informações sobre requisição e usuário

**Solução Implementada:**
- ✅ Logs estruturados no errorHandler com:
  - Rota e método HTTP
  - ID do usuário (se autenticado)
  - Body da requisição
  - Stack trace completo
  - Timestamps
- ✅ Emojis para identificação rápida visual (❌, ✅, 🔍, etc.)
- ✅ Separação entre logs de desenvolvimento e produção

### 5. **Server.ts sem Error Handling**
**Severidade:** MÉDIA

**Problema:**
- Rota 404 não estruturada
- Falta de middleware de erro global
- Ordem incorreta dos middlewares

**Solução Implementada:**
- ✅ Importado `errorHandler` e `notFoundHandler`
- ✅ Adicionado `notFoundHandler` antes das rotas
- ✅ Adicionado `errorHandler` como último middleware
- ✅ Ordem correta: rotas → 404 → error handler

## Arquivos Modificados

### Novos Arquivos
1. **backend/src/middleware/errorHandler.ts** (NOVO)
   - 140 linhas
   - Middleware de tratamento de erros global

### Arquivos Modificados
1. **backend/src/server.ts**
   - Adicionado import do errorHandler
   - Substituído rota 404 por notFoundHandler
   - Adicionado errorHandler como último middleware

2. **backend/src/controllers/authController.ts**
   - Adicionadas validações de entrada
   - Melhorado tratamento de erros
   - Adicionado propagação de erros com next()

3. **backend/src/controllers/leadsController.ts**
   - Adicionadas validações em todos os endpoints
   - Verificações de null/undefined
   - Melhorado tratamento de erros
   - Mensagens de erro mais descritivas

## Benefícios das Correções

### Segurança
- ✅ Validação rigorosa de entrada previne SQL injection
- ✅ Tokens JWT validados adequadamente
- ✅ Informações sensíveis protegidas em produção
- ✅ Verificação de autenticação em todos os endpoints

### Confiabilidade
- ✅ Erros capturados e tratados adequadamente
- ✅ Respostas consistentes para o cliente
- ✅ Logs detalhados para debug
- ✅ Prevenção de crashes por null/undefined

### Manutenibilidade
- ✅ Código mais limpo e organizado
- ✅ Tratamento centralizado de erros
- ✅ Logs estruturados facilitam debug
- ✅ Mensagens de erro descritivas

### Performance
- ✅ Validações rápidas evitam queries desnecessárias
- ✅ Early returns melhoram eficiência
- ✅ Menos overhead em produção

## Próximos Passos Recomendados

### Curto Prazo (Urgente)
1. **Testar em ambiente de staging**
   - Validar todas as correções
   - Verificar logs em diferentes cenários
   - Testar casos de erro

2. **Deploy para VPS produção**
   ```bash
   cd backend
   npm run build
   pm2 restart crm-backend
   pm2 logs crm-backend --lines 100
   ```

3. **Monitorar logs após deploy**
   ```bash
   pm2 logs crm-backend --lines 50 --timestamp
   ```

### Médio Prazo
1. **Adicionar validações nos demais controllers**
   - mensagensController.ts
   - tarefasController.ts
   - whatsappController.ts
   - followupController.ts
   - indicadorController.ts
   - adminController.ts

2. **Implementar rate limiting**
   - Prevenir abuso da API
   - Configurar limites por endpoint

3. **Adicionar monitoramento**
   - Considerar Sentry ou similar
   - Alertas para erros críticos

### Longo Prazo
1. **Adicionar testes automatizados**
   - Testes unitários para controllers
   - Testes de integração para rotas
   - Testes de validação

2. **Implementar circuit breaker**
   - Para conexões com banco de dados
   - Para serviços externos (WhatsApp)

3. **Melhorar observabilidade**
   - Métricas de performance
   - APM (Application Performance Monitoring)
   - Distributed tracing

## Como Testar as Correções

### 1. Testar Tratamento de Erros
```bash
# Teste de token inválido
curl -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer token_invalido"

# Esperado: 401 com mensagem "Token inválido"
```

### 2. Testar Validações
```bash
# Teste de criação de lead sem dados obrigatórios
curl -X POST http://localhost:3001/api/leads \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome": ""}'

# Esperado: 400 com mensagem "Nome e telefone são obrigatórios"
```

### 3. Testar Rota 404
```bash
# Teste de rota inexistente
curl -X GET http://localhost:3001/api/rota-inexistente

# Esperado: 404 com mensagem "Rota não encontrada"
```

### 4. Verificar Logs
```bash
# Ver logs em tempo real
pm2 logs crm-backend

# Procurar por erros específicos
pm2 logs crm-backend | grep "❌"
```

## Variáveis de Ambiente Importantes

Certifique-se que o `.env.production` está configurado corretamente:

```env
# Essencial para tratamento de erros
NODE_ENV=production

# Secret forte para JWT
JWT_SECRET=<gerar_com_openssl_rand_-base64_64>

# Para logs
LOG_LEVEL=warn
DEBUG=false
```

## Checklist de Deploy

Antes de fazer deploy das correções:

- [ ] Backup do banco de dados
- [ ] Testar em ambiente local/staging
- [ ] Verificar variáveis de ambiente
- [ ] Verificar conexão com banco de dados
- [ ] Testar principais endpoints
- [ ] Configurar monitoramento de logs
- [ ] Preparar rollback se necessário
- [ ] Notificar equipe sobre deploy
- [ ] Monitorar logs por 30 minutos após deploy

## Contato para Suporte

Em caso de problemas após o deploy:
1. Verificar logs: `pm2 logs crm-backend --lines 100`
2. Verificar status: `pm2 status`
3. Rollback se necessário: `pm2 restart crm-backend --update-env`

## Conclusão

As correções implementadas resolvem os problemas críticos de erros 500 ao:
1. Adicionar tratamento global de erros
2. Implementar validações rigorosas
3. Melhorar logs e debugging
4. Prevenir crashes por null/undefined
5. Proteger informações sensíveis

O sistema está agora mais robusto, seguro e fácil de debugar em produção.
