# API Integration Test Guide - GQueue Frontend

Este guia documenta como testar a integração completa do dashboard com a API do backend GQueue.

## Pré-requisitos

1. **Backend GQueue rodando**:
   ```bash
   # Verificar se o backend está ativo
   curl -X GET 'http://localhost:8080/api/v1/ping'
   ```

2. **Frontend configurado**:
   ```bash
   cd gqueue-frontend
   yarn install
   yarn start
   ```

## Testes de Integração

### 1. Teste de Carregamento Inicial de Eventos

**Cenário**: Dashboard carrega eventos da API automaticamente ao iniciar

**Passos**:
1. Iniciar o dashboard
2. Observar a seção "Registered Events"
3. Verificar indicadores na interface

**Verificações**:
- ✅ Eventos são carregados automaticamente
- ✅ Indicador mostra "Source: API"
- ✅ Count mostra número correto de eventos
- ✅ "Last updated" mostra horário atual
- ✅ Auto-refresh mostra "Auto ON" (verde)

**Endpoint testado**:
```bash
GET /api/v1/events
```

### 2. Teste de Fallback para Dados Locais

**Cenário**: API indisponível, dashboard usa dados locais

**Passos**:
1. Parar o backend temporariamente
2. Iniciar o dashboard ou clicar "Refresh"
3. Observar comportamento

**Verificações**:
- ✅ Notificação de erro aparece
- ✅ Indicador mostra "Source: Local (API Error)" ou "Local Storage"
- ✅ Eventos de exemplo são exibidos
- ✅ Funcionalidade permanece operacional

### 3. Teste de Refresh Manual

**Cenário**: Usuário atualiza lista manualmente

**Passos**:
1. Clicar no botão "Refresh"
2. Observar indicadores de loading
3. Verificar atualização dos dados

**Verificações**:
- ✅ Botão mostra estado "Refreshing..." com spinner
- ✅ Lista mostra indicador de carregamento
- ✅ Dados são atualizados após completar
- ✅ "Last updated" é atualizado
- ✅ Notificação de sucesso aparece

### 4. Teste de Auto-refresh

**Cenário**: Sistema atualiza eventos automaticamente

**Passos**:
1. Verificar que auto-refresh está ativo (botão verde "Auto ON")
2. Aguardar 60 segundos (intervalo padrão)
3. Observar atualização automática

**Verificações**:
- ✅ "Last updated" é atualizado automaticamente
- ✅ Novos eventos da API são carregados
- ✅ Sem interrupção na experiência do usuário

### 5. Teste de Toggle Auto-refresh

**Cenário**: Ativar/desativar refresh automático

**Passos**:
1. Clicar no botão "Auto ON"
2. Verificar mudança para "Auto OFF" (cinza)
3. Aguardar 60+ segundos
4. Clicar novamente para reativar

**Verificações**:
- ✅ Botão muda de verde para cinza
- ✅ Auto-refresh é desabilitado
- ✅ "Last updated" não é atualizado automaticamente
- ✅ Notificação confirma mudança de estado

### 6. Teste de Criação + Refresh

**Cenário**: Criar evento e verificar na lista

**Passos**:
1. Criar um novo evento via formulário
2. Aguardar criação bem-sucedida
3. Clicar "Refresh" para recarregar da API
4. Verificar se o novo evento aparece

**Verificações**:
- ✅ Evento é criado via POST /api/v1/event/consumer
- ✅ Notificação de sucesso aparece
- ✅ Refresh carrega eventos atualizados da API
- ✅ Novo evento aparece na lista

## Testes de Cenários de Erro

### 1. API Timeout

**Configuração**:
```javascript
// No formulário de criação, configurar timeout baixo
API Timeout: 1000ms (1 segundo)
```

**Teste**:
1. Configurar timeout muito baixo
2. Tentar refresh
3. Observar comportamento

**Resultado esperado**:
- ❌ Timeout error após 1 segundo
- 🔄 Fallback para dados locais
- 📢 Notificação de erro apropriada

### 2. API Retorna Erro HTTP

**Simulação**:
```bash
# Simular erro 500 no backend ou usar URL inválida
```

**Teste**:
1. Configurar URL inválida ou backend com erro
2. Tentar refresh
3. Observar tratamento de erro

**Resultado esperado**:
- ❌ Erro HTTP capturado
- 🔄 Fallback para dados locais
- 📢 Mensagem de erro específica

### 3. Resposta API Malformada

**Cenário**: API retorna JSON inválido ou estrutura incorreta

**Resultado esperado**:
- ⚠️ Dados são transformados ou ignorados
- 🔄 Fallback para dados locais
- 📢 Warning no console

## Validação de Dados

### Formato Esperado da API

**GET /api/v1/events**:
```json
[
  {
    "id": "string",
    "name": "string",
    "service_name": "string",
    "repo_url": "string",
    "team_owner": "string",
    "triggers": [
      {
        "service_name": "string",
        "type": "persistent|temporary",
        "host": "string",
        "path": "string",
        "headers": {},
        "option": {
          "queue_type": "external.high|external.medium|external.low|internal.medium",
          "max_retries": "number",
          "retention": "string",
          "unique_ttl": "string"
        }
      }
    ],
    "created_at": "ISO Date string"
  }
]
```

### Transformação de Dados

O dashboard transforma automaticamente dados da API para garantir compatibilidade:

- Campos ausentes recebem valores padrão
- IDs são gerados se não fornecidos
- Datas são padronizadas para ISO format
- Arrays vazios são tratados adequadamente

## Monitoramento e Debug

### DevTools - Network Tab

**Verificar requests**:
1. Abrir DevTools (F12)
2. Ir para aba Network
3. Filtrar por "XHR/Fetch"
4. Observar chamadas da API

**Requests esperados**:
- `GET /api/v1/ping` - Health check
- `GET /api/v1/events` - Load events
- `POST /api/v1/event/consumer` - Create event

### Console Logs

**Logs importantes**:
```javascript
// Sucesso
"Loaded X events from API"

// Warnings
"Failed to fetch events: HTTP 500"
"API response is not an array"

// Errors
"Error fetching events from API:"
"Connection timeout after Xms"
```

### Indicadores Visuais

**Status da API** (header):
- 🟢 Verde: "API Connected"
- 🔴 Vermelho: "API Disconnected"
- 🟡 Amarelo: "Checking API..."

**Source dos dados**:
- "Source: API" - Dados da API
- "Source: Local Storage" - Dados locais
- "Source: Local (API Error)" - Fallback por erro

## Comandos de Teste Úteis

### Verificar Backend

```bash
# Health check
curl -X GET 'http://localhost:8080/api/v1/ping'

# Listar eventos
curl -X GET 'http://localhost:8080/api/v1/events' \
  -H "Accept: application/json"

# Criar evento de teste
curl -X POST 'http://localhost:8080/api/v1/event/consumer' \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test.integration",
    "service_name": "test-service",
    "repo_url": "https://github.com/test/repo",
    "team_owner": "test-team",
    "triggers": [{
      "service_name": "test-consumer",
      "type": "persistent",
      "host": "http://localhost:3333",
      "path": "/test",
      "headers": {"Content-Type": "application/json"},
      "option": {
        "queue_type": "external.medium",
        "max_retries": 3,
        "retention": "24h",
        "unique_ttl": "60s"
      }
    }]
  }'
```

### Simular Problemas

```bash
# Simular API offline
# Parar o backend e tentar refresh no dashboard

# Simular timeout
# Configurar timeout baixo no dashboard e fazer request

# Simular resposta inválida
# Modificar backend para retornar JSON inválido
```

## Checklist de Integração

- [ ] Dashboard carrega eventos da API automaticamente
- [ ] Refresh manual funciona corretamente
- [ ] Auto-refresh funciona (60s por padrão)
- [ ] Toggle auto-refresh funciona
- [ ] Fallback para dados locais funciona
- [ ] Indicadores de status estão corretos
- [ ] Notificações aparecem adequadamente
- [ ] Criação de eventos integra com refresh
- [ ] Tratamento de erros está funcionando
- [ ] Performance é aceitável
- [ ] Timeouts são respeitados
- [ ] Dados são transformados corretamente

## Conclusão

A integração com a API fornece:

1. **Carregamento automático** de eventos reais
2. **Sincronização** entre frontend e backend
3. **Fallback robusto** para dados locais
4. **Controle manual e automático** de refresh
5. **Feedback visual** claro sobre status
6. **Tratamento de erros** adequado

O dashboard agora funciona como uma interface completa para gerenciar eventos GQueue via API REST.
