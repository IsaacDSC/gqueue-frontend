# Setup Screen Guide - GQueue Frontend

Este guia documenta a nova tela de configuração inicial do GQueue Dashboard.

## Funcionalidade Implementada

### Tela de Setup Inicial
- **Objetivo**: Configurar servidor e autenticação antes de acessar o dashboard
- **Quando aparece**: Primeira execução ou quando não há configuração salva
- **Arquivo**: `src/setup.html`

## Características da Tela de Setup

### 🎨 Design
- **Layout**: Centralizado com gradiente de fundo
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Tema**: Consistente com o dashboard principal
- **Animações**: Transições suaves e feedback visual

### ⚙️ Configurações Disponíveis

#### 1. Server URL
- **Campo**: URL do servidor da API
- **Padrão**: `http://localhost:8080`
- **Validação**: Verifica se é uma URL válida
- **Auto-teste**: Testa conexão automaticamente ao sair do campo

#### 2. Authentication Token
- **Campo**: Token Bearer opcional para autenticação
- **Tipo**: Campo de senha com toggle de visibilidade
- **Comportamento**: Enviado no header `Authorization: Bearer {token}`

### 🔄 Funcionalidades

#### Teste de Conexão
- **Endpoint**: `GET /api/v1/ping`
- **Timeout**: 10 segundos
- **Status**: Visual feedback (sucesso/erro/loading)
- **Auto-teste**: Executa automaticamente quando URL válida é inserida

#### Configurações Salvas
- **Armazenamento**: localStorage do navegador
- **Histórico**: Últimas 5 configurações utilizadas
- **Quick-load**: Clique para carregar configuração anterior

#### Validações
- **URL**: Formato válido obrigatório
- **Conexão**: Teste bem-sucedido antes de conectar
- **Feedback**: Mensagens claras de erro/sucesso

## Fluxo de Uso

### 1. Primeira Execução
```
Iniciar App → Verificar config → Não existe → Redirecionar para setup.html
```

### 2. Configuração
```
1. Inserir Server URL (ex: http://localhost:8080)
2. [Opcional] Inserir Authentication Token
3. Clicar "Test Connection"
4. Aguardar validação ✅
5. Clicar "Connect & Start"
6. Redirecionamento para dashboard principal
```

### 3. Reconfigurações
```
Dashboard → Botão "Server" → Confirmar → Voltar para setup.html
```

## Estrutura de Armazenamento

### Configuração Ativa
```javascript
// localStorage: 'gqueue-config'
{
  "serverUrl": "http://localhost:8080",
  "authToken": "optional-bearer-token",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Configurações Salvas
```javascript
// localStorage: 'gqueue-saved-configs'
[
  {
    "serverUrl": "http://localhost:8080",
    "authToken": "token1",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  {
    "serverUrl": "http://production-server.com",
    "authToken": "token2",
    "timestamp": "2024-01-14T15:20:00Z"
  }
]
```

## Integração com Dashboard

### Headers de Autenticação
Todas as requisições da API incluem automaticamente:
```javascript
const headers = {
  "Accept": "application/json",
  "Content-Type": "application/json"  // Para POST
};

if (this.authToken) {
  headers["Authorization"] = `Bearer ${this.authToken}`;
}
```

### Endpoints Afetados
- `GET /api/v1/ping` - Health check
- `GET /api/v1/events` - Listar eventos
- `POST /api/v1/event/consumer` - Criar evento

## Testes

### Teste 1: Primeira Execução
```bash
# Limpar configurações
localStorage.clear()

# Iniciar app
yarn start

# Resultado esperado
✅ Tela de setup aparece
✅ Campos vazios (exceto URL padrão)
✅ Botões funcionais
```

### Teste 2: Configuração Válida
```bash
# Preencher formulário
Server URL: http://localhost:8080
Token: (opcional)

# Clicar "Test Connection"
✅ Status: "Testing connection..."
✅ Status: "✅ Connection successful!"
✅ Botão "Connect & Start" habilitado

# Clicar "Connect & Start"
✅ Status: "🚀 Starting dashboard..."
✅ Redirecionamento para dashboard
✅ Dashboard carrega normalmente
```

### Teste 3: Servidor Indisponível
```bash
# Parar backend ou usar URL inválida
Server URL: http://localhost:9999

# Clicar "Test Connection"
✅ Status: "❌ Connection failed"
✅ Botão "Connect & Start" permanece desabilitado
✅ Mensagem de erro clara
```

### Teste 4: Configurações Salvas
```bash
# Após primeira configuração bem-sucedida
✅ Seção "Recent Connections" aparece
✅ Lista mostra configuração anterior
✅ Clique carrega dados nos campos
✅ Teste automático é executado
```

### Teste 5: Token de Autenticação
```bash
# Configurar com token
Server URL: http://localhost:8080
Token: my-secret-token

# Verificar integração
✅ Requisições incluem header Authorization
✅ Dashboard funciona normalmente
✅ Todas APIs respeitam autenticação
```

### Teste 6: Reconfiguração
```bash
# No dashboard funcionando
1. Clicar botão "Server" no header
2. Confirmar redirecionamento
✅ Volta para tela de setup
✅ Dados atuais pré-preenchidos
✅ Pode alterar configuração
```

## Resolução de Problemas

### Problema: Tela de setup não aparece
**Causa**: Configuração corrompida no localStorage
**Solução**:
```javascript
localStorage.removeItem('gqueue-config');
location.reload();
```

### Problema: Teste de conexão falha
**Possíveis causas**:
- Backend não está rodando
- URL incorreta
- Firewall/proxy bloqueando
- Token inválido

**Debug**:
```bash
# Verificar backend
curl -X GET 'http://localhost:8080/api/v1/ping'

# Verificar console do navegador (F12)
# Verificar Network tab para detalhes da requisição
```

### Problema: Dashboard não carrega após setup
**Causa**: Configuração não foi salva corretamente
**Solução**:
```javascript
// Verificar no console
console.log(localStorage.getItem('gqueue-config'));

// Se vazio, reconfigurar
localStorage.removeItem('gqueue-config');
window.location.href = 'setup.html';
```

## Arquivo de Configuração (Opcional)

Para desenvolvimento, pode criar `config.json` na raiz:
```json
{
  "serverUrl": "http://localhost:8080",
  "authToken": "dev-token",
  "environment": "development"
}
```

## Benefícios da Implementação

### ✅ Experiência do Usuário
- **Setup guiado**: Processo claro e intuitivo
- **Validação**: Testa conexão antes de prosseguir
- **Feedback**: Status visual em tempo real
- **Histórico**: Reutilização de configurações anteriores

### ✅ Flexibilidade
- **Multi-servidor**: Suporte a diferentes ambientes
- **Autenticação**: Token Bearer opcional
- **Persistência**: Configurações salvas automaticamente
- **Reconfiguração**: Fácil mudança de servidor

### ✅ Robustez
- **Validação**: URLs e conexões verificadas
- **Fallback**: Tratamento de erros elegante
- **Timeout**: Evita travamentos
- **Cleanup**: Limpeza de configurações inválidas

A tela de setup inicial fornece uma base sólida para configuração do GQueue Dashboard, garantindo que os usuários sempre tenham uma conexão válida antes de acessar as funcionalidades principais.
