# Debug Guide - Dashboard Loading Issues

Este guia ajuda a diagnosticar e resolver problemas quando o dashboard não carrega após o redirecionamento da tela de setup.

## Sintomas Comuns

1. **Tela branca**: Dashboard não carrega nada após redirecionamento
2. **Loading infinito**: Fica travado em "Loading events..."
3. **Erro de configuração**: Redirecionamento contínuo para setup
4. **Gráficos não aparecem**: Charts não são renderizados

## Ferramentas de Debug

### 1. Arquivo de Teste Minimal
Use `src/minimal-dashboard.html` para testar isoladamente:

```bash
# Abrir no navegador
http://localhost:3000/src/minimal-dashboard.html
```

**O que testa**:
- Carregamento de configuração
- Conexão com API
- Carregamento de eventos
- Logs detalhados

### 2. Arquivo de Debug Completo
Use `src/test-dashboard.html` para análise avançada:

```bash
# Abrir no navegador
http://localhost:3000/src/test-dashboard.html
```

**O que testa**:
- Existência do objeto Dashboard
- Carregamento de scripts
- Estado interno da aplicação

## Checklist de Diagnóstico

### ✅ 1. Verificar Configuração

**No Console do Navegador (F12)**:
```javascript
// Verificar se config existe
console.log(localStorage.getItem('gqueue-config'));

// Verificar se é válida
const config = JSON.parse(localStorage.getItem('gqueue-config'));
console.log('Config:', config);
console.log('Has serverUrl:', !!config?.serverUrl);
console.log('Has authToken:', !!config?.authToken);
```

**Resultado esperado**:
```json
{
  "serverUrl": "http://localhost:8080",
  "authToken": "optional-token",
  "apiTimeout": 10000,
  "autoRefreshEnabled": true,
  "autoRefreshInterval": 60000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### ✅ 2. Verificar Scripts

**No Console**:
```javascript
// Verificar se Chart.js carregou
console.log('Chart.js loaded:', typeof Chart !== 'undefined');

// Verificar se Dashboard class existe
console.log('Dashboard class:', typeof Dashboard !== 'undefined');

// Verificar se instância existe
console.log('Dashboard instance:', window.dashboard);
```

### ✅ 3. Verificar Conectividade

**Manual**:
```bash
# Testar API diretamente
curl -X GET 'http://localhost:8080/api/v1/ping'
curl -X GET 'http://localhost:8080/api/v1/events'
```

**No Console**:
```javascript
// Testar via browser
fetch('http://localhost:8080/api/v1/ping')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

### ✅ 4. Verificar Logs

**Abrir DevTools → Console** e procurar por:

**Logs esperados (sucesso)**:
```
[Dashboard] Loaded config: {serverUrl: "...", ...}
[Dashboard] Dashboard initializing with config: {...}
[Dashboard] Loading local events...
[Dashboard] Scheduling API load...
[Dashboard] Starting API load...
[Dashboard] Fetching events from: http://localhost:8080/api/v1/events
[Dashboard] API Response: [...]
[Dashboard] Finished loading events, isLoadingEvents = false
```

**Logs de erro comum**:
```
[Dashboard] No valid config found, redirecting to setup
[Dashboard] Configuration missing serverUrl, treating as invalid
[Dashboard] Dashboard initialization failed: ...
[Dashboard] Error fetching events from API: ...
```

## Soluções por Problema

### 🔧 Problema 1: Redirecionamento Contínuo

**Causa**: Configuração não está sendo salva ou é inválida

**Solução**:
```javascript
// 1. Limpar configuração corrompida
localStorage.removeItem('gqueue-config');
localStorage.removeItem('gqueue-saved-configs');

// 2. Ir para setup e reconfigurar
window.location.href = 'setup.html';
```

### 🔧 Problema 2: Tela Branca

**Causa**: Erro JavaScript impedindo inicialização

**Solução**:
1. Abrir DevTools → Console
2. Procurar erros em vermelho
3. Se erro de Chart.js: verificar CDN
4. Se erro de fetch: verificar conectividade

**Verificar CDN**:
```html
<!-- Verificar se estes links funcionam -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### 🔧 Problema 3: Loading Infinito

**Causa**: Estado de loading não está sendo resetado

**Solução no Console**:
```javascript
// Forçar reset do loading
if (window.dashboard) {
  window.dashboard.isLoadingEvents = false;
  window.dashboard.renderEventsList();
}

// Ou usar função de debug
if (window.dashboard) {
  window.dashboard.forceStopLoading();
}
```

### 🔧 Problema 4: Gráficos Não Carregam

**Causa**: Chart.js não carregou ou elementos DOM não existem

**Verificar**:
```javascript
// Verificar Chart.js
console.log('Chart:', typeof Chart);

// Verificar elementos DOM
console.log('RPM Chart:', document.getElementById('rpmChart'));
console.log('LAG Chart:', document.getElementById('lagChart'));
console.log('DLQ Chart:', document.getElementById('dlqChart'));
```

**Solução**:
1. Recarregar página
2. Verificar conexão com internet (CDN)
3. Verificar se IDs dos elementos existem no HTML

## Procedimento de Reset Completo

Se nada funcionar, reset completo:

```javascript
// 1. Limpar todo o localStorage
localStorage.clear();

// 2. Recarregar página
location.reload();

// 3. Vai automaticamente para setup
// 4. Reconfigurar tudo do zero
```

## Logs de Debug Personalizados

Adicionar logs personalizados para debug:

```javascript
// No console, ativar logs detalhados
console.log('=== DASHBOARD DEBUG ===');
console.log('Config:', localStorage.getItem('gqueue-config'));
console.log('Dashboard class:', typeof Dashboard);
console.log('Dashboard instance:', window.dashboard);
console.log('Chart.js:', typeof Chart);

// Se dashboard existe, mostrar estado interno
if (window.dashboard) {
  console.log('API URL:', window.dashboard.apiBaseUrl);
  console.log('Has token:', !!window.dashboard.authToken);
  console.log('Events count:', window.dashboard.events?.length);
  console.log('Is loading:', window.dashboard.isLoadingEvents);
}
```

## Testes de Validação

### Teste 1: Setup → Dashboard
```
1. Ir para setup.html
2. Configurar servidor válido
3. Testar conexão (deve ser ✅)
4. Clicar "Connect & Start"
5. Deve redirecionar e carregar dashboard
```

### Teste 2: Configuração Manual
```javascript
// Configurar manualmente via console
const config = {
  serverUrl: 'http://localhost:8080',
  authToken: null,
  apiTimeout: 10000,
  autoRefreshEnabled: true,
  autoRefreshInterval: 60000,
  timestamp: new Date().toISOString()
};
localStorage.setItem('gqueue-config', JSON.stringify(config));
location.reload();
```

### Teste 3: API Isolada
```bash
# Terminal 1: Verificar backend
curl -X GET 'http://localhost:8080/api/v1/ping'

# Terminal 2: Iniciar frontend
cd gqueue-frontend
yarn start
```

## Arquivos de Apoio

- `src/minimal-dashboard.html` - Teste básico
- `src/test-dashboard.html` - Debug avançado
- `src/setup.html` - Configuração inicial
- `src/index.html` - Dashboard principal

## Contato para Problemas Persistentes

Se o problema persistir após todos os testes:

1. **Capturar logs**: Console inteiro (F12 → Console → Ctrl+A → Ctrl+C)
2. **Capturar config**: `localStorage.getItem('gqueue-config')`
3. **Capturar erro**: Screenshot da tela de erro
4. **Ambiente**: Navegador, versão, OS

O dashboard deve carregar corretamente seguindo este guia de debug.
