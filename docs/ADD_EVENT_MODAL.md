# Add Event Modal - Documentação

## Visão Geral

O `AddEventModal` é um componente React que permite criar novos eventos no sistema GQueue através de uma interface modal. O modal oferece duas formas de configuração: modo Form (formulário visual) e modo JSON (edição direta do JSON).

## Funcionalidades

### 1. **Configuração da API** (opcional, recolhível)
- **API Base URL**: Define a URL base da API (padrão: `http://localhost:8080`)
- **Timeout**: Define o timeout das requisições em milissegundos (padrão: `10000`)
- **Test Connection**: Botão para testar a conectividade com a API

### 2. **Event Details** (Detalhes do Evento)
- **Event Name**: Nome do evento (ex: `payment.processed`)
- **Service Name**: Nome do serviço que publica o evento (ex: `my-app`)
- **Repository URL**: URL do repositório do código (ex: `http://github.com/my-org/my-repo`)
- **Team Owner**: Equipe responsável pelo evento (ex: `my-team`)

### 3. **Trigger Configuration** (Configuração de Triggers)

#### Modo Form
- Permite adicionar múltiplos triggers através de interface visual
- Cada trigger contém:
  - **Trigger Service Name**: Nome do serviço consumidor
  - **Type**: Tipo do trigger (`persistent`, `one-time`, `scheduled`)
  - **Host**: URL do host do consumidor
  - **Path**: Caminho do endpoint no consumidor
  - **Options**:
    - **Queue Type**: Tipo da fila (`external.medium`, `external.high`, `external.low`, `internal`)
    - **Max Retries**: Número máximo de tentativas (0-10)
    - **Retention**: Tempo de retenção (ex: `168h`)
    - **Unique TTL**: Tempo de vida único (ex: `60s`)

#### Modo JSON
- Permite editar diretamente o JSON da configuração
- Inclui botões para:
  - **Format JSON**: Formatar o JSON automaticamente
  - **Load Example**: Carregar um exemplo pré-definido

### 4. **Funcionalidades Adicionais**

#### Debug Mode
- Quando ativado, mostra um painel de debug com logs detalhados
- Exibe informações sobre:
  - Dados do formulário submetidos
  - Conversão para formato da API
  - Respostas da API
  - Erros detalhados

#### Múltiplos Triggers
- **Add Another Trigger**: Adiciona um novo trigger ao formulário
- **Remove**: Remove um trigger específico (disponível quando há mais de um)

## Estrutura da API

### Endpoint de Criação
```
POST /api/v1/event/consumer
```

### Formato do JSON
```json
{
  "name": "payment.processed",
  "service_name": "my-app",
  "repo_url": "http://github.com/my-org/my-repo",
  "team_owner": "my-team",
  "triggers": [
    {
      "service_name": "consumer-1",
      "type": "persistent",
      "host": "http://localhost:3333",
      "path": "/wq/payment/processed",
      "headers": {
        "Content-Type": "application/json"
      },
      "option": {
        "queue_type": "external.medium",
        "max_retries": 3,
        "retention": "168h",
        "unique_ttl": "60s"
      }
    }
  ]
}
```

## Como Usar

### 1. Integração no Componente
```tsx
import AddEventModal from '../components/AddEventModal';

const [isModalOpen, setIsModalOpen] = useState(false);

<AddEventModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
    // Executado quando o evento é criado com sucesso
    console.log("Event created successfully!");
  }}
/>
```

### 2. Abrindo o Modal
```tsx
<button onClick={() => setIsModalOpen(true)}>
  + Add Event
</button>
```

## Hook useEvents

O modal utiliza o hook `useEvents` que fornece:

### Métodos
- `createEvent(eventData)`: Cria um novo evento
- `fetchEvents()`: Busca todos os eventos
- `testApiConnection(baseUrl)`: Testa conexão com a API
- `clearError()`: Limpa erros

### Estados
- `events`: Lista de eventos
- `loading`: Estado de carregamento
- `error`: Mensagem de erro (se houver)

## Tratamento de Erros

### Erros Comuns e Soluções

1. **"Failed to execute 'json' on 'Response': Unexpected end of JSON input"**
   - **Causa**: API retorna resposta vazia ou não-JSON
   - **Solução**: O hook foi atualizado para lidar com respostas vazias

2. **Erro de conexão**
   - **Causa**: API não está rodando ou URL incorreta
   - **Solução**: Verificar se a API está rodando em `http://localhost:8080`

3. **Erro de validação**
   - **Causa**: Campos obrigatórios não preenchidos ou formato inválido
   - **Solução**: Verificar todos os campos obrigatórios

## Ferramentas de Debug

### Arquivo de Teste
Um arquivo HTML de teste está disponível em `/public/test-api.html` que permite:
- Testar conectividade com a API
- Validar JSON de eventos
- Criar eventos manualmente
- Visualizar respostas da API

### Debug Mode no Modal
- Ative o "Debug Mode" no canto superior direito do modal
- Visualize logs detalhados de todas as operações
- Use o botão "Clear Log" para limpar o histórico

## Exemplos de Uso

### Evento Simples
```json
{
  "name": "user.created",
  "service_name": "user-service",
  "repo_url": "http://github.com/company/user-service",
  "team_owner": "backend-team",
  "triggers": [
    {
      "service_name": "notification-service",
      "type": "persistent",
      "host": "http://localhost:3001",
      "path": "/webhooks/user-created",
      "headers": {
        "Content-Type": "application/json"
      },
      "option": {
        "queue_type": "external.high",
        "max_retries": 5,
        "retention": "72h",
        "unique_ttl": "30s"
      }
    }
  ]
}
```

### Evento com Múltiplos Triggers
```json
{
  "name": "order.completed",
  "service_name": "order-service",
  "repo_url": "http://github.com/company/order-service",
  "team_owner": "commerce-team",
  "triggers": [
    {
      "service_name": "email-service",
      "type": "persistent",
      "host": "http://localhost:3002",
      "path": "/send-confirmation",
      "headers": {
        "Content-Type": "application/json"
      },
      "option": {
        "queue_type": "external.medium",
        "max_retries": 3,
        "retention": "168h",
        "unique_ttl": "60s"
      }
    },
    {
      "service_name": "analytics-service",
      "type": "persistent",
      "host": "http://localhost:3003",
      "path": "/track-order",
      "headers": {
        "Content-Type": "application/json"
      },
      "option": {
        "queue_type": "external.low",
        "max_retries": 1,
        "retention": "24h",
        "unique_ttl": "120s"
      }
    }
  ]
}
```

## Tipos TypeScript

```typescript
interface Event {
  id?: string;
  name: string;
  service_name: string;
  repo_url: string;
  team_owner: string;
  triggers: Trigger[];
  created_at?: string;
  updated_at?: string;
}

interface Trigger {
  service_name: string;
  type: string;
  host: string;
  path: string;
  headers: Record<string, string>;
  option: TriggerOption;
}

interface TriggerOption {
  queue_type: string;
  max_retries: number;
  retention: string;
  unique_ttl: string;
}
```
