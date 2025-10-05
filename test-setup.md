# GQueue Frontend Test Setup

Este documento descreve como testar o dashboard GQueue Frontend com integração ao backend.

## Pré-requisitos

1. **Backend GQueue rodando**:
   ```bash
   # Verifique se o backend está rodando
   curl -X GET 'http://localhost:8080/api/v1/ping'
   ```

2. **Frontend instalado**:
   ```bash
   cd gqueue-frontend
   yarn install
   ```

## Testes de Funcionalidade

### 1. Teste de Inicialização

```bash
# Iniciar o dashboard
yarn start
```

**Verificações**:
- ✅ Aplicação abre sem erros
- ✅ Tema escuro/claro funciona
- ✅ Gráficos são exibidos com dados simulados
- ✅ Status da API aparece no header

### 2. Teste de Conexão com API

**No Dashboard**:
1. Observar o indicador de status da API no header
2. Verificar se mostra "API Connected" (verde) ou "API Disconnected" (vermelho)

**Teste Manual**:
```bash
# Parar o backend temporariamente e verificar se o status muda
# Reiniciar o backend e verificar se o status volta ao normal
```

### 3. Teste de Criação de Eventos

**Passos**:
1. Clicar em "Add Event"
2. Verificar configuração da API (deve mostrar http://localhost:8080)
3. Clicar em "Test Connection" - deve mostrar sucesso
4. Preencher formulário com dados de teste:

```json
{
  "name": "test.event",
  "service_name": "test-service",
  "repo_url": "https://github.com/test/repo",
  "team_owner": "test-team",
  "trigger_service_name": "test-consumer",
  "type": "persistent",
  "host": "http://localhost:3333",
  "path": "/wq/test/event",
  "queue_type": "external.medium",
  "max_retries": 3,
  "retention": "168h",
  "unique_ttl": "60s"
}
```

5. Clicar em "Create Event"

**Verificações**:
- ✅ Formulário envia sem erros
- ✅ Evento aparece na lista
- ✅ Notificação de sucesso é exibida
- ✅ Modal fecha automaticamente

### 4. Teste de Visualização de Eventos

**Passos**:
1. Na lista de eventos, clicar em "View JSON"
2. Verificar modal com JSON formatado
3. Testar botão "Copy JSON"
4. Fechar modal

**Verificações**:
- ✅ JSON é exibido corretamente formatado
- ✅ Botão de copiar funciona
- ✅ Modal fecha corretamente

### 5. Teste de Exclusão de Eventos

**Passos**:
1. Clicar em "Delete" em um evento
2. Confirmar exclusão

**Verificações**:
- ✅ Modal de confirmação aparece
- ✅ Evento é removido da lista
- ✅ Lista é atualizada corretamente

## Teste de Integração com Backend

### Verificar Request HTTP

Usar DevTools do navegador (F12 → Network) para verificar:

**Request esperado**:
```
POST /api/v1/event/consumer
Content-Type: application/json
Accept: application/json

{
  "name": "test.event",
  "service_name": "test-service",
  "repo_url": "https://github.com/test/repo",
  "team_owner": "test-team",
  "triggers": [
    {
      "service_name": "test-consumer",
      "type": "persistent",
      "host": "http://localhost:3333",
      "path": "/wq/test/event",
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

### Verificar Response

**Response esperado (200 OK)**:
```json
{
  "id": "generated-id",
  "status": "created",
  "message": "Event consumer created successfully"
}
```

## Teste de Configuração de API

### Teste com URL Diferente

1. Abrir modal "Add Event"
2. Alterar "API Base URL" para `http://localhost:9999`
3. Clicar "Test Connection"
4. Verificar erro de conexão
5. Voltar para `http://localhost:8080`
6. Verificar conexão bem-sucedida

## Teste de Temas

### Tema Escuro/Claro

1. Clicar no botão "Theme" no header
2. Verificar mudança de cores
3. Clicar em "System" para usar tema do sistema
4. Verificar se tema persiste ao recarregar

## Teste de Responsividade

### Desktop
- ✅ Layout em 3 colunas para gráficos
- ✅ Formulário em 2 colunas
- ✅ Lista de eventos com informações completas

### Tablet (redimensionar janela)
- ✅ Layout adapta para 2 colunas
- ✅ Formulário mantém usabilidade

### Mobile (redimensionar janela)
- ✅ Layout em coluna única
- ✅ Botões permanecem acessíveis

## Troubleshooting

### Erro: "Connection failed"
```bash
# Verificar se backend está rodando
curl -X GET 'http://localhost:8080/api/v1/ping'

# Verificar logs do backend
# Verificar firewall/proxy
```

### Erro: "Event creation failed"
```bash
# Verificar logs do console do navegador (F12)
# Verificar formato do JSON enviado
# Verificar se endpoint existe no backend
curl -X POST 'http://localhost:8080/api/v1/event/consumer' \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Gráficos não carregam
- Verificar console do navegador
- Verificar se Chart.js foi carregado
- Recarregar página

## Comandos Úteis

```bash
# Limpar cache do Electron
rm -rf ~/.cache/gqueue-frontend/

# Limpar dados locais (eventos salvos)
# No DevTools: Application → Local Storage → Clear

# Verificar logs detalhados
yarn dev

# Verificar versão do Electron
./node_modules/.bin/electron --version

# Verificar dependências
yarn list
```

## Checklist Completo

- [ ] Aplicação inicia sem erros
- [ ] Conexão com API funciona
- [ ] Criação de eventos via API funciona
- [ ] Visualização de eventos funciona
- [ ] Exclusão de eventos funciona
- [ ] Temas escuro/claro funcionam
- [ ] Gráficos são exibidos
- [ ] Indicadores de status funcionam
- [ ] Notificações aparecem corretamente
- [ ] Layout responsivo funciona
- [ ] Formulário valida campos obrigatórios
- [ ] Configuração de API pode ser alterada
- [ ] Teste de conexão funciona
- [ ] Dados persistem no localStorage
- [ ] Performance é aceitável
