import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { colors as staticColors, fonts } from '../../src/theme';
import { GET_ME, GET_MP_CONNECT_URL } from '../../src/lib/graphql/queries';
import { DISCONNECT_MP } from '../../src/lib/graphql/mutations';
import AcceptTermsScreen from '../accept-terms';

const roleLabels: Record<string, string> = {
  CUSTOMER: 'Cliente',
  DELIVERER: 'Cliente & Entregador',
  VENDOR: 'Vendedor',
  ADMIN: 'Admin',
  SUPERADMIN: 'Super Admin',
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { alert } = useAlert();
  const { isDark, toggleTheme, colors } = useTheme();
  const isDeliverer = user?.isDeliverer || user?.role === 'DELIVERER';
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { data: meData } = useQuery(GET_ME, { fetchPolicy: 'network-only' });
  const [fetchMpUrl, { loading: mpUrlLoading }] = useLazyQuery(GET_MP_CONNECT_URL);
  const [disconnectMp, { loading: disconnectLoading }] = useMutation(DISCONNECT_MP);

  const mpConnected = meData?.me?.mpConnected ?? user?.mpConnected ?? false;

  useEffect(() => {
    if (meData?.me && user) {
      updateUser({ ...user, mpConnected: meData.me.mpConnected });
    }
  }, [meData?.me?.mpConnected]);

  async function handleConnectMp() {
    try {
      const { data } = await fetchMpUrl();
      if (data?.mpConnectUrl) {
        await Linking.openURL(data.mpConnectUrl);
      }
    } catch (err) {
      alert('Erro', 'Nao foi possivel obter o link de conexao. Tente novamente.');
    }
  }

  function handleDisconnectMp() {
    alert('Desconectar Mercado Pago', 'Tem certeza? Voce deixara de receber pagamentos de entregas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectMp();
            if (user) {
              updateUser({ ...user, mpConnected: false });
            }
          } catch (err) {
            alert('Erro', 'Nao foi possivel desconectar. Tente novamente.');
          }
        },
      },
    ]);
  }

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
    { icon: 'location-outline' as const, label: 'Meus enderecos', onPress: () => router.push('/addresses') },
    { icon: 'card-outline' as const, label: 'Formas de pagamento', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Ajuda', onPress: () => setShowHelp(true) },
    { icon: 'document-text-outline' as const, label: 'Termos de uso', onPress: () => setShowTerms(true) },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <View style={[styles.avatar, isDeliverer && { backgroundColor: colors.success }]}>
          <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: colors.textLight }]}>{user?.email}</Text>
      </View>

      {/* Banner de entregador */}
      {!isDeliverer && !user?.pendingRole && !user?.rejectedAt && (
        <TouchableOpacity
          style={[styles.delivererBanner, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}
          onPress={() => router.push('/deliverer-register')}
        >
          <View style={styles.delivererBannerIcon}>
            <Ionicons name="bicycle" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.delivererBannerTitle}>Quero ser entregador</Text>
            <Text style={[styles.delivererBannerSubtitle, { color: colors.textLight }]}>
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

      {isDeliverer && !mpConnected && (
        <TouchableOpacity style={[styles.mpBanner, { backgroundColor: colors.card }]} onPress={handleConnectMp} disabled={mpUrlLoading}>
          <View style={styles.mpBannerIcon}>
            <Ionicons name="wallet-outline" size={28} color="#009EE3" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mpBannerTitle}>Conecte seu Mercado Pago</Text>
            <Text style={[styles.mpBannerSubtitle, { color: colors.textLight }]}>
              Conecte para receber os valores das entregas diretamente na sua conta
            </Text>
          </View>
          {mpUrlLoading ? (
            <ActivityIndicator size="small" color="#009EE3" />
          ) : (
            <Ionicons name="chevron-forward" size={24} color="#009EE3" />
          )}
        </TouchableOpacity>
      )}

      {isDeliverer && mpConnected && (
        <View style={styles.mpConnectedBanner}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.delivererActiveText, { flex: 1 }]}>
            Mercado Pago conectado
          </Text>
          <TouchableOpacity onPress={handleDisconnectMp} disabled={disconnectLoading}>
            {disconnectLoading ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={styles.mpDisconnectText}>Desconectar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.menu, { backgroundColor: colors.card }]}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={idx} style={[styles.menuItem, { borderBottomColor: colors.grayLight }]} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={colors.text} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Dark mode toggle */}
      <View style={[styles.menu, { backgroundColor: colors.card, marginTop: 12 }]}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0, borderBottomColor: colors.grayLight }]} onPress={toggleTheme}>
          <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color={colors.text} />
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            {isDark ? 'Modo escuro' : 'Modo claro'}
          </Text>
          <View style={{
            width: 48, height: 24, borderRadius: 12,
            backgroundColor: isDark ? '#FF6B35' : '#95A5A6',
            justifyContent: 'center',
            paddingHorizontal: 2,
          }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: '#FFFFFF',
              transform: [{ translateX: isDark ? 24 : 0 }],
            }} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <Modal visible={showTerms} animationType="slide">
        <AcceptTermsScreen readOnly onClose={() => setShowTerms(false)} />
      </Modal>

      <Modal visible={showHelp} animationType="slide" transparent>
        <View style={[styles.helpOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.helpModal, { backgroundColor: colors.card }]}>
            <View style={styles.helpHeader}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>Ajuda & Suporte</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity
                style={[styles.helpItem, { borderBottomColor: colors.grayLight }]}
                onPress={() => { setShowHelp(false); Linking.openURL('mailto:suporte@bcmtech.com.br'); }}
              >
                <View style={[styles.helpIconBox, { backgroundColor: '#FF6B35' + '15' }]}>
                  <Ionicons name="mail-outline" size={24} color="#FF6B35" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpItemTitle, { color: colors.text }]}>Email de Suporte</Text>
                  <Text style={[styles.helpItemSub, { color: colors.textLight }]}>suporte@bcmtech.com.br</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helpItem, { borderBottomColor: colors.grayLight }]}
                onPress={() => { setShowHelp(false); Linking.openURL('mailto:contato@bcmtech.com.br'); }}
              >
                <View style={[styles.helpIconBox, { backgroundColor: '#3498DB' + '15' }]}>
                  <Ionicons name="briefcase-outline" size={24} color="#3498DB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpItemTitle, { color: colors.text }]}>Contato Comercial</Text>
                  <Text style={[styles.helpItemSub, { color: colors.textLight }]}>contato@bcmtech.com.br</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </TouchableOpacity>

              <View style={[styles.helpItem, { borderBottomColor: colors.grayLight, opacity: 0.5 }]}>
                <View style={[styles.helpIconBox, { backgroundColor: '#27AE60' + '15' }]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#27AE60" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpItemTitle, { color: colors.text }]}>WhatsApp</Text>
                  <Text style={[styles.helpItemSub, { color: colors.textLight }]}>Em breve</Text>
                </View>
              </View>

              <View style={styles.helpFaqSection}>
                <Text style={[styles.helpFaqTitle, { color: colors.text }]}>Perguntas Frequentes</Text>

                {[
                  { q: 'Como faco um pedido?', a: 'Escolha uma loja, adicione produtos ao carrinho e finalize o pedido escolhendo a forma de pagamento.' },
                  { q: 'Como me torno entregador?', a: 'No seu perfil, clique em "Quero ser entregador" e preencha o cadastro. Apos aprovacao, voce podera fazer entregas.' },
                  { q: 'Como acompanho meu pedido?', a: 'Apos realizar o pedido, voce pode acompanhar o status em tempo real na aba "Pedidos".' },
                  { q: 'Como conecto meu Mercado Pago?', a: 'Se voce e entregador, va no perfil e clique em "Conecte seu Mercado Pago" para receber pagamentos das entregas.' },
                ].map((item, i) => (
                  <View key={i} style={[styles.helpFaqItem, { borderBottomColor: colors.grayLight }]}>
                    <Text style={[styles.helpFaqQuestion, { color: colors.text }]}>{item.q}</Text>
                    <Text style={[styles.helpFaqAnswer, { color: colors.textLight }]}>{item.a}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.helpFooter}>
              <Text style={[styles.helpFooterText, { color: colors.textLight }]}>
                Atendimento: Seg a Sex, 9h as 18h
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticColors.background },
  header: {
    backgroundColor: staticColors.white,
    padding: 24,
    paddingTop: 56,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: staticColors.white },
  name: { fontSize: fonts.xlarge, fontWeight: 'bold', color: staticColors.text, marginTop: 12 },
  email: { fontSize: fonts.regular, color: staticColors.textLight, marginTop: 4 },
  roleBadge: {
    marginTop: 8,
    backgroundColor: staticColors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { color: staticColors.primary, fontSize: fonts.tiny, fontWeight: '600' },
  delivererBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: staticColors.primary + '30',
    borderStyle: 'dashed',
    gap: 12,
  },
  delivererBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: staticColors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  delivererBannerTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: staticColors.primary,
  },
  delivererBannerSubtitle: {
    fontSize: fonts.small,
    color: staticColors.textLight,
    marginTop: 2,
  },
  delivererActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: staticColors.success + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  delivererActiveText: {
    fontSize: fonts.small,
    color: staticColors.success,
    fontWeight: '600',
  },
  pendingBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: staticColors.warning + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: fonts.small,
    color: staticColors.warning,
    fontWeight: '600',
  },
  rejectedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: staticColors.danger + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  rejectedText: {
    fontSize: fonts.small,
    color: staticColors.danger,
    fontWeight: '600',
  },
  rejectedReason: {
    fontSize: fonts.tiny,
    color: staticColors.danger,
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
    color: staticColors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryTimerText: {
    fontSize: fonts.tiny,
    color: staticColors.danger,
    marginTop: 8,
    opacity: 0.7,
  },
  mpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#009EE3' + '30',
    borderStyle: 'dashed',
    gap: 12,
  },
  mpBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#009EE3' + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mpBannerTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: '#009EE3',
  },
  mpBannerSubtitle: {
    fontSize: fonts.small,
    color: staticColors.textLight,
    marginTop: 2,
  },
  mpConnectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: staticColors.success + '15',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
  },
  mpDisconnectText: {
    fontSize: fonts.small,
    color: staticColors.danger,
    fontWeight: '600',
  },
  menu: { backgroundColor: staticColors.white, marginTop: 16, borderRadius: 16, marginHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.grayLight,
  },
  menuLabel: { flex: 1, fontSize: fonts.regular, color: staticColors.text },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
  },
  logoutText: { fontSize: fonts.regular, color: staticColors.danger, fontWeight: '600' },
  helpOverlay: { flex: 1, justifyContent: 'flex-end' },
  helpModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  helpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  helpTitle: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  helpItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  helpIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  helpItemTitle: { fontSize: fonts.regular, fontWeight: '600' },
  helpItemSub: { fontSize: fonts.small, marginTop: 2 },
  helpFaqSection: { marginTop: 20 },
  helpFaqTitle: { fontSize: fonts.medium, fontWeight: 'bold', marginBottom: 12 },
  helpFaqItem: { paddingVertical: 12, borderBottomWidth: 1 },
  helpFaqQuestion: { fontSize: fonts.regular, fontWeight: '600', marginBottom: 4 },
  helpFaqAnswer: { fontSize: fonts.small, lineHeight: 20 },
  helpFooter: { marginTop: 16, alignItems: 'center' },
  helpFooterText: { fontSize: fonts.small },
});
