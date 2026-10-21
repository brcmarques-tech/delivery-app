import { Alert } from 'react-native';

/**
 * Alerta que funciona em qualquer lugar do app — inclusive na web.
 *
 * O `Alert.alert` do react-native NAO EXISTE no react-native-web: a chamada
 * vira um no-op silencioso. Na web, "Cancelar pedido", "Tive um problema",
 * erros do carrinho e os avisos da tela de ganhos simplesmente nao faziam
 * nada — o botao parecia quebrado.
 *
 * O app ja tem um alerta proprio (AlertContext), mas ele so e acessivel por
 * hook, e parte de quem precisa avisar fica FORA do provider (o AuthContext
 * esta acima dele na arvore). Esta ponte resolve os dois casos: o
 * AlertProvider se registra aqui ao montar, e `alerta()` usa o alerta do app
 * sempre que ele estiver montado. Sem provider montado (so no instante do
 * boot), cai no Alert nativo — que no celular funciona.
 */
export type BotaoDeAlerta = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type Exibidor = (titulo: string, mensagem?: string, botoes?: BotaoDeAlerta[]) => void;

let exibidor: Exibidor | null = null;

/** Chamado pelo AlertProvider. Devolve a funcao que desfaz o registro. */
export function registrarAlerta(fn: Exibidor): () => void {
  exibidor = fn;
  return () => {
    if (exibidor === fn) exibidor = null;
  };
}

export function alerta(titulo: string, mensagem?: string, botoes?: BotaoDeAlerta[]): void {
  if (exibidor) {
    exibidor(titulo, mensagem, botoes);
    return;
  }
  Alert.alert(titulo, mensagem, botoes);
}
