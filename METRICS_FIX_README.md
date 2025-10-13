# Correção do Problema de Reload na Tela de Métricas

## Problema Identificado

A tela de métricas estava causando reloads desnecessários da página a cada atualização, prejudicando a experiência do usuário. O problema era causado por vários fatores:

### Principais Causas

1. **Loop infinito de re-renders no hook `useInsights`**
   - O objeto `mergedConfig` estava sendo recriado a cada render
   - Dependências circulares no `useEffect` causavam re-execuções constantes
   - O `fetchInsights` callback estava sendo recriado desnecessariamente

2. **Uso de `window.location.reload()` no `MetricsDebugPanel`**
   - Função `clearLocalStorage` forçava reload completo da página
   - Não havia alternativa para atualizar apenas os componentes

3. **Auto-refresh muito agressivo**
   - Intervalo padrão de 30 segundos muito frequente
   - Auto-refresh habilitado por padrão causava atualizações indesejadas

4. **Re-renders desnecessários no `PublisherDashboard`**
   - Dependências mal configuradas nos hooks
   - Objetos sendo recriados a cada render

## Soluções Implementadas

### 1. Otimização do Hook `useInsights`

```typescript
// Antes: objeto recriado a cada render
const mergedConfig = { ...DEFAULT_CONFIG, ...config };

// Depois: memoização com dependências específicas
const mergedConfig = useMemo(
  () => ({ ...DEFAULT_CONFIG, ...config }),
  [config.serverUrl, config.authToken, config.refreshInterval, config.autoRefresh],
);
```

**Mudanças principais:**
- Adicionado `useMemo` para `mergedConfig`
- Removido `fetchInsights` das dependências do `useEffect`
- Implementado fetch direto no `useEffect` inicial com `AbortController`
- Melhorado o auto-refresh para evitar stale closures

### 2. Eliminação do `window.location.reload()`

```typescript
// Antes: reload completo da página
const clearLocalStorage = () => {
  if (window.confirm("...")) {
    localStorage.clear();
    window.location.reload(); // ❌ Causa reload da página
  }
};

// Depois: atualização apenas dos componentes
const clearLocalStorage = () => {
  if (window.confirm("...")) {
    localStorage.clear();
    setStorageInfo(getLocalStorageInfo());
    setClearTrigger((prev) => prev + 1);
    window.dispatchEvent(new Event("storage")); // ✅ Trigger de re-render
  }
};
```

### 3. Desabilitação do Auto-refresh

```typescript
// No PublisherDashboard
const { data: insights, loading, error, refetch } = useInsights({
  ...memoizedServerConfig,
  autoRefresh: false, // ✅ Desabilitado por padrão
});
```

### 4. Otimização do `PublisherDashboard`

```typescript
// Memoização da configuração do servidor
const memoizedServerConfig = useMemo(() => {
  return serverConfig || { serverUrl: "http://localhost:8080" };
}, [serverConfig]);

// Prevenção de event bubbling no botão refresh
<button
  onClick={(e) => {
    e.preventDefault(); // ✅ Previne comportamento padrão
    refetch();
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
>
  🔄 Refresh
</button>
```

### 5. Correção do Hook `useConnection`

```typescript
// Removido timeout não suportado nativamente
const response = await fetch(url, {
  method: "GET",
  headers,
  // timeout: 10000, // ❌ Não suportado
});
```

## Benefícios das Correções

### ✅ Performance Melhorada
- Eliminação de re-renders desnecessários
- Redução de chamadas à API
- Menor uso de recursos do navegador

### ✅ Experiência do Usuário
- Sem reloads indesejados da página
- Atualizações suaves dos componentes
- Controle manual sobre quando atualizar

### ✅ Estabilidade
- Eliminação de loops infinitos
- Melhor gerenciamento de estado
- Cancelamento adequado de requisições

## Como Usar Agora

### Atualização Manual
- Use o botão "🔄 Refresh" para atualizar as métricas quando necessário
- A atualização é instantânea e não recarrega a página

### Debug Panel
- O botão "🗑️ Clear All" agora apenas limpa o localStorage
- Os componentes são atualizados automaticamente sem reload

### Configuração de Auto-refresh (Opcional)
Se desejar habilitar o auto-refresh:

```typescript
const { data: insights } = useInsights({
  serverUrl: "http://localhost:8080",
  autoRefresh: true,
  refreshInterval: 60000, // 1 minuto (recomendado)
});
```

## Arquivos Modificados

1. `frontend/src/hooks/useInsights.ts` - Correção principal do loop de re-renders
2. `frontend/src/pages/PublisherDashboard.tsx` - Otimizações e desabilitação do auto-refresh
3. `frontend/src/components/MetricsDebugPanel.tsx` - Remoção do `window.location.reload()`
4. `frontend/src/hooks/useConnection.ts` - Correção do timeout não suportado

## Teste das Correções

Para verificar se as correções funcionaram:

1. Acesse a página de métricas (`/metrics`)
2. Observe que não há reloads automáticos
3. Use o botão "🔄 Refresh" - deve atualizar apenas os dados
4. No Debug Panel, use "🗑️ Clear All" - deve limpar sem reload
5. Verifique o console do navegador - não deve haver erros ou warnings relacionados a re-renders

## Monitoramento Contínuo

Para evitar regressões futuras:

- ✅ Sempre use `useMemo` para objetos que são dependências de hooks
- ✅ Evite `window.location.reload()` - prefira atualizações de estado
- ✅ Configure auto-refresh com intervalos adequados (≥ 60 segundos)
- ✅ Use `useCallback` para funções que são dependências
- ✅ Implemente `AbortController` para requisições que podem ser canceladas
