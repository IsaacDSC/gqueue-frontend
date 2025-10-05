# Multiple Triggers Configuration Guide

Este guia explica como usar a nova funcionalidade de múltiplos triggers no GQueue Frontend.

## Visão Geral

A seção **Trigger Configuration** agora suporta:
- ✅ **Múltiplos triggers** - Adicione quantos triggers precisar
- ✅ **Modo JSON** - Cole configurações JSON diretamente
- ✅ **Validação automática** - Verifica se o JSON está correto
- ✅ **Interface intuitiva** - Alterne entre formulário e JSON facilmente

## Como Usar

### 1. Modo Formulário (Padrão)

Por padrão, o sistema inicia com um trigger vazio no modo formulário:

1. **Preencha os dados do primeiro trigger:**
   - Trigger Service Name: Nome do serviço consumidor
   - Type: `persistent` ou `temporary`
   - Host: URL completa do endpoint (ex: `http://localhost:3333`)
   - Path: Caminho do endpoint (ex: `/wq/example/event`)

2. **Configure as opções:**
   - Queue Type: `external.high`, `external.medium`, `external.low`, `internal.medium`
   - Max Retries: Número de tentativas (0-10)
   - Retention: Tempo de retenção (ex: `168h`)
   - Unique TTL: TTL para constraints únicos (ex: `60s`)

3. **Adicione mais triggers (opcional):**
   - Clique no botão **"Add Another Trigger"**
   - Preencha os dados do novo trigger
   - Repita quantas vezes necessário

4. **Remova triggers (se necessário):**
   - Clique no ícone de lixeira ao lado do título do trigger
   - ⚠️ O primeiro trigger não pode ser removido

### 2. Modo JSON

Para usar o modo JSON:

1. **Ative o modo JSON:**
   - Clique no toggle no canto superior direito da seção
   - O toggle muda de "Form" para "JSON"

2. **Cole ou edite o JSON:**
   - Cole sua configuração JSON no campo de texto
   - Ou clique em **"Import from Form"** para converter os dados do formulário

3. **Valide o JSON:**
   - Clique em **"Validate JSON"** para verificar se está correto
   - Mensagens de erro ou sucesso aparecerão abaixo

## Exemplos de Configuração

### Exemplo 1: Trigger Único (Formulário)
```
Trigger Service Name: order-processor
Type: persistent
Host: http://localhost:3333
Path: /wq/orders/created
Queue Type: external.high
Max Retries: 3
Retention: 168h
Unique TTL: 60s
```

### Exemplo 2: Múltiplos Triggers (Formulário)
```
Trigger #1:
- Service: order-processor
- Type: persistent
- Host: http://localhost:3333
- Path: /wq/orders/created

Trigger #2:
- Service: email-service
- Type: temporary
- Host: http://localhost:4444
- Path: /wq/emails/send

Trigger #3:
- Service: inventory-service
- Type: persistent
- Host: http://localhost:5555
- Path: /wq/inventory/update
```

### Exemplo 3: Configuração JSON
```json
[
  {
    "service_name": "order-processor",
    "type": "persistent",
    "host": "http://localhost:3333",
    "path": "/wq/orders/created",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "external.high",
      "max_retries": 3,
      "retention": "168h",
      "unique_ttl": "60s"
    }
  },
  {
    "service_name": "email-service",
    "type": "temporary",
    "host": "http://localhost:4444",
    "path": "/wq/emails/send",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "external.medium",
      "max_retries": 5,
      "retention": "72h",
      "unique_ttl": "30s"
    }
  },
  {
    "service_name": "inventory-service",
    "type": "persistent",
    "host": "http://localhost:5555",
    "path": "/wq/inventory/update",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "internal.medium",
      "max_retries": 2,
      "retention": "240h",
      "unique_ttl": "120s"
    }
  }
]
```

## Funcionalidades Avançadas

### Conversão Automática
- **Form → JSON**: Clique em "Import from Form" no modo JSON
- **JSON → Form**: Alterne para modo formulário (os dados do JSON serão preservados durante o submit)

### Validação em Tempo Real
- O sistema valida automaticamente os dados antes do envio
- Campos obrigatórios são verificados
- Formato JSON é validado quando usar o modo JSON

### Persistência de Dados
- Os dados são mantidos ao alternar entre modos
- O formulário é resetado apenas ao fechar o modal
- Validação acontece antes do envio ao backend

## Campos Obrigatórios

Para cada trigger, os seguintes campos são obrigatórios:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `service_name` | Nome do serviço consumidor | `order-processor` |
| `type` | Tipo do trigger | `persistent` ou `temporary` |
| `host` | URL do host | `http://localhost:3333` |
| `path` | Caminho do endpoint | `/wq/orders/created` |
| `queue_type` | Tipo da fila | `external.high` |
| `max_retries` | Máximo de tentativas | `3` |
| `retention` | Tempo de retenção | `168h` |
| `unique_ttl` | TTL único | `60s` |

## Dicas e Boas Práticas

### 🎯 **Uso do Formulário**
- Ideal para configurações simples
- Melhor para quem prefere interface visual
- Boa para adicionar poucos triggers

### 🎯 **Uso do JSON**
- Ideal para configurações complexas
- Melhor para quem já tem a configuração pronta
- Permite copiar/colar de outras configurações
- Mais rápido para múltiplos triggers

### 🎯 **Validação**
- Sempre valide o JSON antes de submeter
- Use "Import from Form" para gerar JSON correto
- Verifique se todos os campos obrigatórios estão preenchidos

### 🎯 **Performance**
- Não há limite técnico de triggers, mas considere performance
- Triggers em paralelo podem sobrecarregar o sistema
- Use `queue_type` apropriado para balancear carga

## Solução de Problemas

### ❌ "Invalid JSON format"
- Verifique se o JSON está bem formatado
- Use "Import from Form" para gerar JSON válido
- Certifique-se de que é um array de objetos

### ❌ "At least one trigger is required"
- Preencha pelo menos um trigger completo
- Verifique se todos os campos obrigatórios estão preenchidos

### ❌ "service_name is required"
- Todos os triggers devem ter um nome de serviço
- Nomes devem ser strings não vazias

### ❌ Trigger não aparece na lista
- Verifique se o formulário foi submetido corretamente
- Confirme se a conexão com a API está funcionando
- Verifique se não há erros no console do navegador

## Compatibilidade

Esta funcionalidade é compatível com:
- ✅ Todas as versões do backend GQueue
- ✅ Configurações existentes (são migradas automaticamente)
- ✅ Modo escuro/claro
- ✅ Todos os navegadores modernos

---

**Desenvolvido para GQueue Frontend v2.0+**
