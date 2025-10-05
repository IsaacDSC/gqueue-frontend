# Teste da Funcionalidade de Múltiplos Triggers

Este arquivo contém exemplos práticos para testar a nova funcionalidade de múltiplos triggers.

## 🧪 Teste 1: Formulário com Múltiplos Triggers

### Passos:
1. Abra o dashboard do GQueue Frontend
2. Clique em "Add Event"
3. Preencha os dados básicos do evento:
   - Name: `test.multiple.triggers`
   - Service Name: `test-service`
   - Repo URL: `https://github.com/test/repo`
   - Team Owner: `qa-team`

4. Na seção Trigger Configuration, preencha o primeiro trigger:
   - Trigger Service Name: `order-processor`
   - Type: `persistent`
   - Host: `http://localhost:3001`
   - Path: `/wq/orders/created`
   - Queue Type: `external.high`
   - Max Retries: `3`
   - Retention: `168h`
   - Unique TTL: `60s`

5. Clique em "Add Another Trigger" e preencha:
   - Trigger Service Name: `email-service`
   - Type: `temporary`
   - Host: `http://localhost:3002`
   - Path: `/wq/emails/send`
   - Queue Type: `external.medium`
   - Max Retries: `5`
   - Retention: `72h`
   - Unique TTL: `30s`

6. Adicione um terceiro trigger:
   - Trigger Service Name: `inventory-service`
   - Type: `persistent`
   - Host: `http://localhost:3003`
   - Path: `/wq/inventory/update`
   - Queue Type: `internal.medium`
   - Max Retries: `2`
   - Retention: `240h`
   - Unique TTL: `120s`

7. Clique em "Create Event"

### Resultado Esperado:
- Evento criado com 3 triggers
- Console deve mostrar logs de múltiplos triggers
- Backend deve receber array com 3 objetos trigger

## 🧪 Teste 2: Modo JSON

### JSON de Teste:
```json
[
  {
    "service_name": "payment-processor",
    "type": "persistent",
    "host": "http://payment-service:8080",
    "path": "/webhooks/payment-completed",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "external.high",
      "max_retries": 5,
      "retention": "168h",
      "unique_ttl": "60s"
    }
  },
  {
    "service_name": "notification-service",
    "type": "temporary",
    "host": "http://notification-service:8080",
    "path": "/webhooks/send-notification",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "external.medium",
      "max_retries": 3,
      "retention": "72h",
      "unique_ttl": "30s"
    }
  },
  {
    "service_name": "analytics-service",
    "type": "persistent",
    "host": "http://analytics-service:8080",
    "path": "/webhooks/track-event",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "external.low",
      "max_retries": 1,
      "retention": "720h",
      "unique_ttl": "300s"
    }
  }
]
```

### Passos:
1. Abra o dashboard do GQueue Frontend
2. Clique em "Add Event"
3. Preencha os dados básicos:
   - Name: `test.json.triggers`
   - Service Name: `json-test-service`
   - Repo URL: `https://github.com/test/json-repo`
   - Team Owner: `dev-team`

4. Na seção Trigger Configuration:
   - Ative o toggle "JSON" (lado direito)
   - Cole o JSON acima no campo de texto
   - Clique em "Validate JSON"
   - Deve aparecer "✓ Valid JSON format"

5. Clique em "Create Event"

### Resultado Esperado:
- Evento criado com 3 triggers do JSON
- Validação deve passar sem erros
- Console deve mostrar "Using JSON mode for form submission"

## 🧪 Teste 3: Alternância entre Modos

### Passos:
1. Abra o modal de criação de evento
2. Preencha 2 triggers no modo formulário
3. Alterne para modo JSON (toggle)
4. Verifique se o JSON foi gerado automaticamente
5. Modifique algo no JSON
6. Clique em "Validate JSON"
7. Alterne de volta para modo formulário
8. Submeta o evento

### Resultado Esperado:
- JSON deve ser gerado automaticamente dos dados do formulário
- Validação deve funcionar corretamente
- Dados do JSON devem ser usados na submissão final

## 🧪 Teste 4: Remoção de Triggers

### Passos:
1. Adicione 3 triggers no modo formulário
2. Tente remover o primeiro trigger (deve estar oculto)
3. Remova o segundo trigger (ícone da lixeira)
4. Remova o terceiro trigger
5. Verifique se resta apenas 1 trigger
6. Verifique se a numeração foi atualizada

### Resultado Esperado:
- Primeiro trigger não pode ser removido
- Outros triggers são removidos corretamente
- Numeração é atualizada automaticamente
- Sempre resta pelo menos 1 trigger

## 🧪 Teste 5: Validação de Erros

### JSON Inválido:
```json
[
  {
    "service_name": "",
    "type": "invalid-type",
    "host": "not-a-url",
    "path": "",
    "option": {
      "queue_type": "external.high"
    }
  }
]
```

### Passos:
1. Alterne para modo JSON
2. Cole o JSON inválido acima
3. Clique em "Validate JSON"
4. Tente submeter o formulário

### Resultado Esperado:
- Validação deve mostrar erros específicos
- Submissão deve ser bloqueada
- Mensagens de erro devem ser claras

## 🧪 Teste 6: Performance com Muitos Triggers

### JSON com 10 Triggers:
```json
[
  {"service_name": "service-1", "type": "persistent", "host": "http://localhost:3001", "path": "/webhook1", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-2", "type": "persistent", "host": "http://localhost:3002", "path": "/webhook2", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-3", "type": "persistent", "host": "http://localhost:3003", "path": "/webhook3", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-4", "type": "persistent", "host": "http://localhost:3004", "path": "/webhook4", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-5", "type": "persistent", "host": "http://localhost:3005", "path": "/webhook5", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-6", "type": "persistent", "host": "http://localhost:3006", "path": "/webhook6", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-7", "type": "persistent", "host": "http://localhost:3007", "path": "/webhook7", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-8", "type": "persistent", "host": "http://localhost:3008", "path": "/webhook8", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-9", "type": "persistent", "host": "http://localhost:3009", "path": "/webhook9", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}},
  {"service_name": "service-10", "type": "persistent", "host": "http://localhost:3010", "path": "/webhook10", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}}
]
```

### Passos:
1. Use o JSON acima no modo JSON
2. Valide e submeta
3. Monitore performance no console
4. Verifique se o backend processa corretamente

### Resultado Esperado:
- Interface deve permanecer responsiva
- Todos os 10 triggers devem ser processados
- Sem travamentos ou erros de memória

## 🔍 Pontos de Verificação

### Console do Navegador:
- ✅ "Trigger events bound successfully"
- ✅ "Toggle trigger mode clicked" (ao alternar)
- ✅ "Add trigger button clicked" (ao adicionar)
- ✅ "Adding trigger #X" (ao adicionar novos)
- ✅ "Using JSON/form mode for submission"
- ✅ "Extracted triggers from form/JSON"

### Interface Visual:
- ✅ Toggle funciona corretamente
- ✅ Botões de adicionar/remover funcionam
- ✅ Numeração dos triggers é atualizada
- ✅ Validação JSON mostra mensagens
- ✅ Formulário é resetado corretamente

### Backend:
- ✅ Recebe array de triggers
- ✅ Processa múltiplos triggers
- ✅ Salva evento com configuração correta

## 🐛 Casos de Erro Comuns

1. **"Cannot read property of undefined"**
   - Verifique se IDs dos elementos estão corretos
   - Confirme que o DOM foi carregado completamente

2. **"Validate JSON button not working"**
   - Abra o console e verifique erros
   - Confirme que o método está sendo chamado

3. **"Triggers not being added"**
   - Verifique se event listeners foram vinculados
   - Confirme que container existe no DOM

4. **"JSON mode not toggling"**
   - Verifique se classes CSS estão sendo aplicadas
   - Confirme que elementos existem

## 📝 Notas para Desenvolvedores

- Use sempre `console.log` para debugar
- Verifique o Network tab para requisições à API
- Teste em diferentes navegadores
- Verifique compatibilidade com modo escuro
- Teste responsividade em mobile

---
**Status:** ✅ Implementação Completa
**Versão:** 1.0
**Testado em:** Chrome, Firefox, Safari
