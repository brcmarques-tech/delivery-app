import { useEffect, useRef } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_ME } from '../lib/graphql/queries';
import { ORDER_UPDATED } from '../lib/graphql/subscriptions';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

export function useOrderNotifications() {
  const { user, updateUser } = useAuth();
  const { alert } = useAlert();
  const initializedRef = useRef(0);

  const { data: meData, refetch: refetchMe } = useQuery(GET_ME, {
    skip: !user,
  });

  // Refresh user data when orders change (role/approval may update)
  useSubscription(ORDER_UPDATED, {
    skip: !user,
    onData: () => { refetchMe(); },
  });

  // Sync user data from server (role changes, approval, rejection, etc)
  useEffect(() => {
    if (!meData?.meApp || !user) return;

    const me = meData.meApp;

    // Skip first two loads to avoid false notifications on login/register
    if (initializedRef.current < 2) {
      initializedRef.current = (initializedRef.current || 0) + 1;
      // Still sync data silently
      if (
        me.role !== user.role ||
        me.isDeliverer !== user.isDeliverer ||
        me.pendingRole !== user.pendingRole
      ) {
        updateUser({
          ...user,
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          isDeliverer: me.isDeliverer,
          pendingRole: me.pendingRole,
          rejectedAt: me.rejectedAt,
          rejectionReason: me.rejectionReason,
          acceptedTermsAt: me.acceptedTermsAt ?? user.acceptedTermsAt,
        });
      }
      return;
    }

    // Detect role change
    const roleChanged = me.role !== user.role;
    const delivererChanged = me.isDeliverer !== user.isDeliverer;
    const pendingChanged = me.pendingRole !== user.pendingRole;
    const rejectionChanged = me.rejectedAt !== user.rejectedAt;

    if (!roleChanged && !delivererChanged && !pendingChanged && !rejectionChanged) return;

    // Approved as deliverer
    if (user.pendingRole === 'DELIVERER' && !me.pendingRole && me.isDeliverer) {
      alert(
        'Cadastro aprovado!',
        'Seu cadastro como entregador foi aprovado! A aba "Entregas" ja esta disponivel.',
      );
    }
    // Rejected
    else if (user.pendingRole === 'DELIVERER' && !me.pendingRole && me.rejectedAt) {
      alert(
        'Cadastro rejeitado',
        me.rejectionReason
          ? `Seu cadastro como entregador foi rejeitado. Motivo: ${me.rejectionReason}`
          : 'Seu cadastro como entregador foi rejeitado.',
      );
    }
    // Role changed by admin (e.g. deliverer -> customer)
    else if (roleChanged && user.role) {
      const roleLabels: Record<string, string> = {
        CUSTOMER: 'Cliente',
        DELIVERER: 'Entregador',
        VENDOR: 'Vendedor',
      };
      alert(
        'Cargo atualizado',
        `Seu cargo foi alterado para: ${roleLabels[me.role] || me.role}`,
      );
    }

    updateUser({
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      isDeliverer: me.isDeliverer,
      pendingRole: me.pendingRole,
      rejectedAt: me.rejectedAt,
      rejectionReason: me.rejectionReason,
    });
  }, [meData]);
}
