import { useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client';
import { ORDER_UPDATED } from '../lib/graphql/subscriptions';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

// Perf (F2): intervalo minimo entre refreshes disparados por evento de pedido.
// Mudanca de role/aprovacao raramente coincide com um update de pedido; o refresh
// periodico do AuthContext (5 min + foreground) ja cobre o caso geral.
const REFRESH_THROTTLE_MS = 60_000;

export function useOrderNotifications() {
  const { user, refreshUser } = useAuth();
  const { alert } = useAlert();
  const initializedRef = useRef(0);
  const prevUserRef = useRef(user);
  const lastRefreshRef = useRef(0);

  // Refresh user data when orders change (role/approval may update).
  // Perf (F2): antes era um GET_ME network-only POR EVENTO — num pedido ativo que
  // troca de status varias vezes isso virava tempestade de rede + re-render.
  // Agora no maximo 1 refresh por minuto (e o AuthContext ja ignora respostas
  // identicas, entao o custo residual e so a chamada).
  useSubscription(ORDER_UPDATED, {
    skip: !user,
    onData: () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) return;
      lastRefreshRef.current = now;
      refreshUser();
    },
  });

  // Detect role/approval changes and notify user
  useEffect(() => {
    if (!user) return;

    const prev = prevUserRef.current;
    prevUserRef.current = user;

    // No previous state to compare against
    if (!prev) return;

    // Skip first two updates to avoid false notifications on login/register
    if (initializedRef.current < 2) {
      initializedRef.current = (initializedRef.current || 0) + 1;
      return;
    }

    // Detect changes
    const roleChanged = user.role !== prev.role;
    const delivererChanged = user.isDeliverer !== prev.isDeliverer;
    const pendingChanged = user.pendingRole !== prev.pendingRole;
    const rejectionChanged = user.rejectedAt !== prev.rejectedAt;

    if (!roleChanged && !delivererChanged && !pendingChanged && !rejectionChanged) return;

    // Approved as deliverer
    if (prev.pendingRole === 'DELIVERER' && !user.pendingRole && user.isDeliverer) {
      alert(
        'Cadastro aprovado!',
        'Seu cadastro como entregador foi aprovado! A aba "Entregas" ja esta disponivel.',
      );
    }
    // Rejected
    else if (prev.pendingRole === 'DELIVERER' && !user.pendingRole && user.rejectedAt) {
      alert(
        'Cadastro rejeitado',
        user.rejectionReason
          ? `Seu cadastro como entregador foi rejeitado. Motivo: ${user.rejectionReason}`
          : 'Seu cadastro como entregador foi rejeitado.',
      );
    }
    // Role changed by admin (e.g. deliverer -> customer)
    else if (roleChanged && prev.role) {
      const roleLabels: Record<string, string> = {
        CUSTOMER: 'Cliente',
        DELIVERER: 'Entregador',
        VENDOR: 'Vendedor',
      };
      alert(
        'Cargo atualizado',
        `Seu cargo foi alterado para: ${roleLabels[user.role] || user.role}`,
      );
    }
  }, [user]);
}
