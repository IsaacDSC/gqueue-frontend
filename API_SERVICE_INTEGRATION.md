# API Service Integration

Este documento descreve a implementação da integração do serviço de API (`src/services/api.js`) no lugar de chamadas diretas no `app.js`.

## Resumo das Mudanças

### 1. Melhorias no Serviço de API (`src/services/api.js`)

#### Correções Implementadas:
- **Controller undefined**: Adicionado `new AbortController()` em cada método
- **Timeout configurável**: Adicionado parâmetro `timeout` no construtor
- **Limpeza de timeout**: Implementado `clearTimeout()` para evitar vazamentos
- **Estrutura de resposta consistente**: Padronizado retorno com `{status, data, error}`
- **Export para módulos**: Adicionada compatibilidade para uso em diferentes ambientes

#### Métodos Disponíveis:
```javascript
// Construtor
new ManagerApi(baseUrl, authToken, timeout = 10000)

// Métodos
await api.createEvent(eventData)  // Retorna: {status: "SUCCESS|ERROR", data?, error?}
await api.getEvents()             // Retorna: {status: "SUCCESS|ERROR", data?, error?}
await api.ping()                  // Retorna: boolean
```

### 2. Refatoração do Dashboard (`src/app.js`)

#### Inicialização da API:
```javascript
// No método checkAndLoadConfig()
this.api = new ManagerApi(this.apiBaseUrl, this.authToken, this.apiTimeout);
```

#### Métodos Refatorados:

**`createEventOnBackend()`** - Antes:
```javascript
const response = await fetch(`${this.apiBaseUrl}/api/v1/event/consumer`, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(eventData),
  signal: controller.signal,
});
```

**`createEventOnBackend()`** - Depois:
```javascript
const result = await this.api.createEvent(eventData);
if (result.status === "ERROR") {
  throw new Error(result.error);
}
this.addEventToLocal(result.data);
```

**`testBackendConnection()`** - Antes:
```javascript
const response = await fetch(`${this.apiBaseUrl}/api/v1/ping`, {
  method: "GET",
  headers: headers,
  signal: controller.signal,
});
return response.ok;
```

**`testBackendConnection()`** - Depois:
```javascript
return await this.api.ping();
```

**`loadEventsFromAPI()`** - Antes:
```javascript
const response = await fetch(`${this.apiBaseUrl}/api/v1/events`, {
  method: "GET",
  headers: headers,
  signal: controller.signal,
});
const apiEvents = await response.json();
```

**`loadEventsFromAPI()`** - Depois:
```javascript
const result = await this.api.getEvents();
if (result.status === "ERROR") {
  console.warn(`Failed to fetch events: ${result.error}`);
  // Handle error...
  return;
}
const apiEvents = result.data;
```

**`testApiConnection()`** - Melhorias:
- Cria instância temporária da API para testar novos parâmetros
- Atualiza a instância principal se o teste for bem-sucedido
- Tratamento de erro mais consistente

### 3. Atualizações nos Arquivos HTML

#### `src/index.html`:
```html
<script src="services/api.js"></script>
<script src="app.js"></script>
```

#### `src/test-dashboard.html`:
- Carregamento sequencial: primeiro `api.js`, depois `app.js`
- Logs detalhados do processo de carregamento

### 4. Arquivo de Teste Criado

**`src/test-api-integration.html`** - Página de teste completa para:
- Testar inicialização do serviço de API
- Testar conexão (ping)
- Testar busca de eventos
- Testar criação de eventos
- Testar integração com o dashboard
- Log detalhado de todas as operações

## Benefícios da Refatoração

### 1. **Centralização**
- Todas as chamadas de API estão centralizadas em um serviço
- Reutilização de código
- Manutenção mais fácil

### 2. **Tratamento de Erro Consistente**
- Estrutura padronizada de resposta
- Timeouts configuráveis
- Melhor handling de AbortController

### 3. **Testabilidade**
- Serviço isolado e testável
- Arquivo de teste dedicado
- Fácil mock para testes unitários

### 4. **Configurabilidade**
- Timeout configurável por instância
- Base URL e auth token flexíveis
- Fácil troca de configurações

### 5. **Manutenibilidade**
- Código mais limpo no dashboard
- Separação de responsabilidades
- Logs mais informativos

## Como Usar

### 1. Inicialização:
```javascript
const api = new ManagerApi('http://localhost:8080', 'your-token', 5000);
```

### 2. Criação de Evento:
```javascript
const result = await api.createEvent({
  queueName: "test-queue",
  exchange: "test-exchange",
  routingKey: "test.key",
  payload: "message content"
});

if (result.status === "SUCCESS") {
  console.log("Event created:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### 3. Buscar Eventos:
```javascript
const result = await api.getEvents();
if (result.status === "SUCCESS") {
  const events = result.data;
  // Process events...
}
```

### 4. Testar Conexão:
```javascript
const isConnected = await api.ping();
if (isConnected) {
  console.log("API is reachable");
}
```

## Testes

Para testar a integração, abra `src/test-api-integration.html` no navegador e execute os testes sequencialmente:

1. **Test API Initialization** - Verifica se o serviço foi carregado corretamente
2. **Test Ping** - Testa conectividade com a API
3. **Test Get Events** - Testa busca de eventos
4. **Test Create Event** - Testa criação de eventos
5. **Test Dashboard** - Verifica integração com o dashboard

## Notas Importantes

- O arquivo `services/api.js` deve ser carregado antes do `app.js`
- A classe `ManagerApi` está disponível globalmente após o carregamento
- Todos os métodos são assíncronos e retornam Promises
- Timeouts são configuráveis e têm fallback para 10 segundos
- O serviço é compatível com diferentes ambientes (browser, Node.js)

## Próximos Passos

1. **Testes Unitários**: Implementar testes automatizados para o serviço
2. **Cache**: Adicionar cache para reduzir chamadas desnecessárias
3. **Retry Logic**: Implementar lógica de retry para falhas temporárias
4. **WebSocket**: Considerar WebSocket para atualizações em tempo real
5. **TypeScript**: Migrar para TypeScript para melhor type safety
