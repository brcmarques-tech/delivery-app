# Lessons Learned

## 2026-03-26: Permission Request Loop no Android

**Erro:** Diagnostiquei o problema do flickering como "re-renders excessivos" e sugeri gerar APK sem ter certeza. Na real era um loop de `requestForegroundPermissionsAsync()` + AppState listener.

**Regra:** Antes de pedir APK novo, SEMPRE:
1. Ler o logcat primeiro para confirmar a causa raiz
2. Se o logcat mostra `GrantPermissionsActivity` em loop → é permission request, não re-render
3. `requestPermissionsAsync()` pode abrir diálogo mesmo com permissão concedida em alguns devices
4. SEMPRE usar `getPermissionsAsync()` (check) antes de `requestPermissionsAsync()` (dialog)
5. AppState listeners que chamam funções com permission request = loop garantido

**Padrão safe para permissões:**
```typescript
let { status } = await Location.getForegroundPermissionsAsync(); // NO dialog
if (status !== 'granted') {
  const req = await Location.requestForegroundPermissionsAsync(); // Dialog only if needed
  status = req.status;
}
```

**Padrão safe para AppState listeners:**
- Usar ref estável (`connectSocketRef.current = fn`) em vez de closure direta
- Dependency array `[]` — nunca depender da função que muda a cada render
- Guard de re-entrada (`connectingRef`) para async functions
