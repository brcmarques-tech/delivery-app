/**
 * Armazenamento de credenciais com fallback para web APENAS em desenvolvimento.
 *
 * Contexto: o fix C2 da auditoria de pagamentos migrou o JWT de AsyncStorage
 * para SecureStore (Keychain no iOS / Keystore no Android), porque AsyncStorage
 * nao e criptografado e qualquer app em device rooted consegue ler.
 *
 * Porem o expo-secure-store NAO tem implementacao web — no navegador as chamadas
 * estouram "ExpoSecureStore.default.getValueWithKeyAsync is not a function".
 *
 * Decisao: em __DEV__ na web caimos para localStorage, para permitir testar o app
 * no navegador sem emulador. Em build de PRODUCAO web a chamada falha de forma
 * explicita, para nunca degradar a seguranca em silencio — se algum dia o app for
 * publicado como web app, isso obriga uma decisao consciente (httpOnly cookie,
 * por exemplo) em vez de guardar JWT em localStorage sem ninguem perceber.
 *
 * No nativo (iOS/Android) o comportamento e inalterado: sempre SecureStore.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

function webUnsupported(op: string): never {
  throw new Error(
    `[secureStorage] "${op}" nao e suportado na web em build de producao. ` +
      `O fallback para localStorage existe apenas em __DEV__. ` +
      `Para publicar uma versao web, implemente armazenamento seguro (ex: cookie httpOnly).`,
  );
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    if (!__DEV__) webUnsupported('getSecureItem');
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (!__DEV__) webUnsupported('setSecureItem');
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage cheio ou bloqueado — ignora, usuario refaz login */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    if (!__DEV__) webUnsupported('deleteSecureItem');
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nada a fazer */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
