// Perf (F2): barramento minusculo para eventos de produto.
// Antes havia 3 subscriptions WS concorrentes de PRODUCT_UPDATED (useProductSync,
// CartContext e store/[id]) — o servidor enviava e o app processava o MESMO evento
// tres vezes. Agora so o useProductSync assina o WS; quem precisa reagir (ex.:
// carrinho atualizando preco local) registra um listener aqui, custo zero de rede.

export interface ProductEventPayload {
  id: string;
  price?: number;
  promotionalPrice?: number | null;
  name?: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  stock?: number | null;
}

type Listener = (product: ProductEventPayload) => void;

const updateListeners = new Set<Listener>();
const deleteListeners = new Set<(id: string) => void>();

export function onProductUpdated(listener: Listener): () => void {
  updateListeners.add(listener);
  return () => { updateListeners.delete(listener); };
}

export function onProductDeleted(listener: (id: string) => void): () => void {
  deleteListeners.add(listener);
  return () => { deleteListeners.delete(listener); };
}

export function emitProductUpdated(product: ProductEventPayload): void {
  updateListeners.forEach((l) => { try { l(product); } catch {} });
}

export function emitProductDeleted(id: string): void {
  deleteListeners.forEach((l) => { try { l(id); } catch {} });
}
