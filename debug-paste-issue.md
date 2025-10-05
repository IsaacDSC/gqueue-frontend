# Debug: Problema com Paste (Cmd+V/Ctrl+V) no Textarea JSON

## 🔍 Diagnóstico do Problema

O usuário relatou que não consegue colar texto usando Cmd+V (macOS) ou Ctrl+V (Windows/Linux) no campo JSON.

## 🧪 Testes de Diagnóstico

### Teste 1: Verificar se o Textarea está Recebendo Foco
1. Abra o modal de criação de evento
2. Alterne para modo JSON
3. Clique no textarea JSON
4. Abra o console do navegador
5. Verifique se aparece: `JSON textarea focused`

**Resultado Esperado:** Log deve aparecer no console

### Teste 2: Testar Paste Manual vs Programático
1. Tente colar usando Ctrl+V/Cmd+V
2. Tente usar o botão "📋 Paste JSON"
3. Compare os resultados

**Se o botão funciona mas o Ctrl+V não:**
- Problema é com event listeners ou CSS
- Verificar se há preventDefault() bloqueando

### Teste 3: Verificar Event Listeners Conflitantes
1. Abra DevTools → Elements
2. Selecione o textarea `#triggers-json`
3. No console, digite:
```javascript
getEventListeners(document.getElementById('triggers-json'))
```
4. Verifique se há listeners desnecessários

### Teste 4: Testar em Diferentes Contextos
1. Teste fora do modal (criar textarea temporário)
2. Teste em modo claro vs escuro
3. Teste em diferentes navegadores

## 🔧 Soluções Implementadas

### Solução 1: Event Listener Específico para Paste
```javascript
jsonTextarea.addEventListener("paste", (e) => {
  console.log("Paste event detected in JSON textarea");
  // Allow the default paste behavior
  setTimeout(() => {
    console.log("JSON textarea content after paste:", jsonTextarea.value.length, "characters");
  }, 10);
});
```

### Solução 2: Botão Alternativo de Paste
- Botão "📋 Paste JSON" usando Clipboard API
- Funciona como fallback se Ctrl+V não funcionar

### Solução 3: Melhorias no Textarea
```html
<textarea
  id="triggers-json"
  spellcheck="false"
  autocomplete="off"
  autocorrect="off"
  autocapitalize="off"
  tabindex="0"
  class="... focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>
```

### Solução 4: Exceção para Tecla Escape
```javascript
// Don't close modal if user is typing in JSON textarea
const activeElement = document.activeElement;
if (activeElement && activeElement.id === "triggers-json") {
  console.log("Escape pressed in JSON textarea - not closing modal");
  return;
}
```

## 🐛 Possíveis Causas do Problema

### 1. Event Listener de Escape Interferindo
- **Sintoma:** Escape key listener pode capturar outros eventos
- **Solução:** Adicionada verificação de elemento ativo

### 2. CSS ou Atributos Bloqueando
- **Sintoma:** Textarea não aceita input do teclado
- **Solução:** Adicionados atributos específicos e foco visual

### 3. Conflito com Modal
- **Sintoma:** Modal intercepta eventos de teclado
- **Solução:** Event listeners específicos para textarea

### 4. Problema de Foco/Tabindex
- **Sintoma:** Textarea não recebe foco corretamente
- **Solução:** Adicionado tabindex="0" e foco programático

## 🧪 Testes de Validação

### Teste A: Paste Básico
```javascript
// No console, teste diretamente:
document.getElementById('triggers-json').focus();
// Então tente Ctrl+V/Cmd+V
```

### Teste B: Clipboard API
```javascript
// Teste se Clipboard API funciona:
navigator.clipboard.readText().then(text => console.log('Clipboard:', text));
```

### Teste C: Event Simulation
```javascript
// Simule evento paste:
const textarea = document.getElementById('triggers-json');
const pasteEvent = new ClipboardEvent('paste', {
  clipboardData: new DataTransfer()
});
pasteEvent.clipboardData.setData('text/plain', '[{"service_name": "test"}]');
textarea.dispatchEvent(pasteEvent);
```

## 📋 JSON de Teste para Paste

### JSON Simples:
```json
[{"service_name": "test", "type": "persistent", "host": "http://localhost:3000", "path": "/test", "headers": {"Content-Type": "application/json"}, "option": {"queue_type": "external.medium", "max_retries": 3, "retention": "168h", "unique_ttl": "60s"}}]
```

### JSON Formatado:
```json
[
  {
    "service_name": "payment-service",
    "type": "persistent",
    "host": "http://localhost:8080",
    "path": "/webhooks/payment",
    "headers": {
      "Content-Type": "application/json"
    },
    "option": {
      "queue_type": "external.high",
      "max_retries": 5,
      "retention": "168h",
      "unique_ttl": "60s"
    }
  }
]
```

## 🔍 Comandos de Debug no Console

### Verificar Event Listeners:
```javascript
// Listar todos os event listeners do textarea
const textarea = document.getElementById('triggers-json');
console.log('Event listeners:', getEventListeners(textarea));
```

### Testar Foco:
```javascript
// Verificar se textarea pode receber foco
const textarea = document.getElementById('triggers-json');
textarea.focus();
console.log('Active element:', document.activeElement.id);
console.log('Can focus:', textarea === document.activeElement);
```

### Testar Paste Programaticamente:
```javascript
// Simular paste
const textarea = document.getElementById('triggers-json');
textarea.value = '[{"test": "paste works"}]';
console.log('Manual paste test:', textarea.value);
```

### Verificar Clipboard API:
```javascript
// Verificar suporte à Clipboard API
console.log('Clipboard API available:', !!navigator.clipboard);
console.log('HTTPS context:', location.protocol === 'https:');
```

## 🚀 Workarounds para o Usuário

### Opção 1: Usar Botão de Paste
1. Copie o JSON desejado (Ctrl+C)
2. Clique no botão "📋 Paste JSON"
3. JSON será colado automaticamente

### Opção 2: Paste Manual com Foco
1. Clique diretamente no textarea
2. Aguarde alguns segundos
3. Tente Ctrl+V/Cmd+V novamente

### Opção 3: Digitação Direta
1. Clique no textarea
2. Delete todo o conteúdo (Ctrl+A, Delete)
3. Digite ou cole o JSON caracter por caracter

### Opção 4: Importar do Formulário
1. Preencha alguns triggers no modo formulário
2. Alterne para JSON
3. Clique em "Import from Form"
4. Edite o JSON gerado

## 📊 Status das Implementações

- ✅ Event listener específico para paste
- ✅ Botão alternativo de paste (Clipboard API)
- ✅ Melhorias nos atributos do textarea
- ✅ Exceção para tecla Escape
- ✅ Logs de debug no console
- ✅ Validação e feedback visual
- ✅ Botão de clear para limpeza
- ✅ Placeholder com exemplo

## 🎯 Próximos Passos

1. **Testar em diferentes navegadores**
   - Chrome, Firefox, Safari, Edge

2. **Verificar em diferentes SOs**
   - macOS (Cmd+V)
   - Windows/Linux (Ctrl+V)

3. **Testar com diferentes tipos de JSON**
   - JSON minificado
   - JSON formatado
   - JSON com caracteres especiais

4. **Monitorar console para logs específicos**
   - "Paste event detected in JSON textarea"
   - "JSON textarea focused"
   - "Paste shortcut detected"

## 📞 Instruções para Reportar Bug

Se o problema persistir, forneça:

1. **Browser e versão**
2. **Sistema operacional**
3. **Logs do console** (F12 → Console)
4. **Steps exatos para reproduzir**
5. **JSON que está tentando colar**
6. **Se o botão "📋 Paste JSON" funciona**

---
**Status:** 🔍 Em investigação
**Prioridade:** Alta
**Última atualização:** Implementação completa com múltiplas soluções
