import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { colors, fonts } from '../../src/theme';

const roleLabels: Record<string, string> = {
  CUSTOMER: 'Cliente',
  DELIVERER: 'Cliente & Entregador',
  VENDOR: 'Vendedor',
  ADMIN: 'Admin',
  SUPERADMIN: 'Super Admin',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { alert } = useAlert();
  const isDeliverer = user?.isDeliverer || user?.role === 'DELIVERER';
  const [retryCountdown, setRetryCountdown] = useState(0);

  const RETRY_DELAY_MS = 30 * 60 * 1000; // 30 minutos

  useEffect(() => {
    if (!user?.rejectedAt) return;
    const rejectedTime = new Date(user.rejectedAt).getTime();
    const unlockTime = rejectedTime + RETRY_DELAY_MS;

    const tick = () => {
      const remaining = unlockTime - Date.now();
      setRetryCountdown(remaining > 0 ? remaining : 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [user?.rejectedAt]);

  const canRetry = user?.rejectedAt && retryCountdown === 0;
  const retryMinutes = Math.floor(retryCountdown / 60000);
  const retrySeconds = Math.floor((retryCountdown % 60000) / 1000);

  async function confirmLogout() {
    await logout();
    router.replace('/auth/login');
  }

  function handleLogout() {
    alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: confirmLogout },
    ]);
  }

  const menuItems = [
    { icon: 'location-outline' as const, label: 'Meus enderecos', onPress: () => {} },
    { icon: 'card-outline' as const, label: 'Formas de pagamento', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Ajuda', onPress: () => {} },
    { icon: 'document-text-outline' as const, label: 'Termos de uso', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, isDeliverer && { backgroundColor: colors.success }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, isDeliverer && { backgroundColor: colors.success + '15' }]}>
          <Text style={[styles.roleText, isDeliverer && { color: colors.success }]}>
            {roleLabels[user?.role || ''] || user?.role}
          </Text>
        </View>
      </View>

      {/* Banner de entregador */}
      {!isDeliverer && !user?.pendingRole && !user?.rejectedAt && (
        <TouchableOpacity
          style={styles.delivererBanner}
          onPress={() => router.push('/deliverer-register')}
        >
          <View style={styles.delivererBannerIcon}>
            <Ionicons name="bicycle" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.delivererBannerTitle}>Quero ser entregador</Text>
            <Text style={styles.delivererBannerSubtitle}>
              Faca entregas e ganhe dinheiro extra
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}

      {user?.pendingRole === 'DELIVERER' && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={styles.pendingText}>
            Cadastro de entregador aguardando aprovacao
          </Text>
        </View>
      )}

      {user?.rejectedAt && !isDeliverer && (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle" size={20} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rejectedText}>Cadastro de entregador rejeitado</Text>
            {user?.rejectionReason && (
              <Text style={styles.rejectedReason}>Motivo: {user.rejectionReason}</Text>
            )}
            {!canRetry && (
              <Text style={styles.retryTimerText}>
                Tente novamente em {retryMinutes}min {retrySeconds}s
              </Text>
            )}
          </View>
          {canRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.push('/deliverer-register')}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.retryButtonText}>Tentar{'\n'}novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isDeliverer && (
        <View style={styles.delivererActiveBanner}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.delivererActiveText}>
            Entregador ativo - veja a aba "Entregas"
          </Text>
        </View>
      )}

      <View style={styles.menu}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={colors.text} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.white,
    padding: 24,
    paddingTop: 56,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  name: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text, marginTop: 12 },
  email: { fontSize: fonts.regular, color: colors.textLight, marginTop: 4 },
  roleBadge: {
    marginTop: 8,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { color: colors.primary, fontSize: fonts.tiny, fontWeight: '600' },
  delivererBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    gap: 12,
  },
  delivererBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  delivererBannerTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.primary,
  },
  delivererBannerSubtitle: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 2,
  },
  delivererActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  delivererActiveText: {
    fontSize: fonts.small,
    color: colors.success,
    fontWeight: '600',
  },
  pendingBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: colors.warning + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: fonts.small,
    color: colors.warning,
    fontWeight: '600',
  },
  rejectedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: colors.danger + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  rejectedText: {
    fontSize: fonts.small,
    color: colors.danger,
    fontWeight: '600',
  },
  rejectedReason: {
    fontSize: fonts.tiny,
    color: colors.danger,
    marginTop: 4,
    opacity: 0.8,
  },
  retryButton: {
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
  },
  retryButtonText: {
    fontSize: fonts.tiny,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryTimerText: {
    fontSize: fonts.tiny,
    color: colors.danger,
    marginTop: 8,
    opacity: 0.7,
  },
  menu: { backgroundColor: colors.white, marginTop: 16, borderRadius: 16, marginHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  menuLabel: { flex: 1, fontSize: fonts.regular, color: colors.text },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
  },
  logoutText: { fontSize: fonts.regular, color: colors.danger, fontWeight: '600' },
});
