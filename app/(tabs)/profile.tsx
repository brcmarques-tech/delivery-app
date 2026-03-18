import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Modal, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as staticColors, fonts } from '../../src/theme';
import { GET_ME } from '../../src/lib/graphql/queries';
import { DISCONNECT_PAYMENT, UPLOAD_IMAGE, UPDATE_APP_PROFILE } from '../../src/lib/graphql/mutations';
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
  const insets = useSafeAreaInsets();
  const isDeliverer = user?.isDeliverer || user?.role === 'DELIVERER';
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { data: meData, refetch: refetchMe } = useQuery(GET_ME, { fetchPolicy: 'network-only' });
  const [disconnectPaymentMut, { loading: disconnectLoading }] = useMutation(DISCONNECT_PAYMENT);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [updateProfile] = useMutation(UPDATE_APP_PROFILE);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const avatarUrl = meData?.meApp?.avatarUrl || null;
  const paymentConnected = meData?.meApp?.paymentConnected ?? user?.paymentConnected ?? false;

  useEffect(() => {
    if (meData?.meApp && user) {
      updateUser({ ...user, paymentConnected: meData.meApp.paymentConnected });
    }
  }, [meData?.meApp?.paymentConnected]);

  function handleConnectPayment() {
    alert(
      'Conectar Pagamento',
      'Para receber pagamentos de entregas, cadastre-se como recebedor no Pagar.me pelo painel ou entre em contato com o suporte.',
      [{ text: 'OK' }],
    );
  }

  function handleDisconnectPayment() {
    alert('Desconectar Pagamento', 'Tem certeza? Voce deixara de receber pagamentos de entregas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectPaymentMut();
            if (user) {
              updateUser({ ...user, paymentConnected: false });
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

  function pickFromGallery() {
    setShowAvatarPicker(false);
    setTimeout(async () => {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        });
        if (!result.canceled && result.assets[0].base64) {
          uploadAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
      } catch {}
    }, 400);
  }

  function pickFromCamera() {
    setShowAvatarPicker(false);
    setTimeout(async () => {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });
        if (!result.canceled && result.assets[0].base64) {
          uploadAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
      } catch {}
    }, 400);
  }

  async function uploadAvatar(base64: string) {
    setUploadingAvatar(true);
    try {
      const { data } = await uploadImage({ variables: { base64, folder: 'avatars' } });
      const url = data?.uploadImage;
      if (url) {
        await updateProfile({
          variables: { avatarUrl: url },
          update: (cache) => {
            const existing: any = cache.readQuery({ query: GET_ME });
            if (existing?.meApp) {
              cache.writeQuery({
                query: GET_ME,
                data: { meApp: { ...existing.meApp, avatarUrl: url } },
              });
            }
          },
        });
      }
    } catch {
      alert('Erro', 'Nao foi possivel atualizar a foto.');
    }
    setUploadingAvatar(false);
  }

  const menuItems = [
    { icon: 'location-outline' as const, label: 'Meus enderecos', onPress: () => router.push('/addresses') },
    { icon: 'card-outline' as const, label: 'Formas de pagamento', onPress: () => router.push('/cards') },
    { icon: 'help-circle-outline' as const, label: 'Ajuda', onPress: () => setShowHelp(true) },
    { icon: 'document-text-outline' as const, label: 'Termos de uso', onPress: () => setShowTerms(true) },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.white, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => setShowAvatarPicker(true)} disabled={uploadingAvatar} activeOpacity={0.7}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, isDeliverer && { backgroundColor: colors.success }]}>
              <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
            {uploadingAvatar ? (
              <ActivityIndicator size={12} color="#FFF" />
            ) : (
              <Ionicons name="camera" size={14} color="#FFF" />
            )}
          </View>
        </TouchableOpacity>
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

      {isDeliverer && !paymentConnected && (
        <TouchableOpacity style={[styles.mpBanner, { backgroundColor: colors.card }]} onPress={handleConnectPayment}>
          <View style={styles.mpBannerIcon}>
            <Ionicons name="wallet-outline" size={28} color="#65A300" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mpBannerTitle}>Conectar Pagamento</Text>
            <Text style={[styles.mpBannerSubtitle, { color: colors.textLight }]}>
              Cadastre-se para receber os valores das entregas diretamente na sua conta
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#65A300" />
        </TouchableOpacity>
      )}

      {isDeliverer && paymentConnected && (
        <View style={styles.paymentConnectedBanner}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.delivererActiveText, { flex: 1 }]}>
            Pagamento conectado
          </Text>
          <TouchableOpacity onPress={handleDisconnectPayment} disabled={disconnectLoading}>
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

      <Modal visible={showAvatarPicker} transparent animationType="fade" onRequestClose={() => setShowAvatarPicker(false)}>
        <TouchableOpacity
          style={styles.avatarPickerOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarPicker(false)}
        >
          <View style={[styles.avatarPickerSheet, { backgroundColor: colors.card }]}>
            <View style={styles.avatarPickerHandle} />
            <View style={styles.avatarPickerOptions}>
              <TouchableOpacity style={[styles.avatarPickerOption, { backgroundColor: colors.primary + '15' }]} onPress={pickFromGallery}>
                <Ionicons name="images" size={28} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.avatarPickerOption, { backgroundColor: colors.primary + '15' }]} onPress={pickFromCamera}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.avatarPickerOption, { backgroundColor: colors.danger + '15' }]} onPress={() => setShowAvatarPicker(false)}>
                <Ionicons name="close" size={28} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTerms} animationType="slide">
        <AcceptTermsScreen readOnly onClose={() => setShowTerms(false)} />
      </Modal>

      <Modal visible={showHelp} animationType="slide" transparent>
        <View style={[styles.helpOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.helpModal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 32 }]}>
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

              <TouchableOpacity
                style={[styles.helpItem, { borderBottomColor: colors.grayLight }]}
                onPress={() => { setShowHelp(false); Linking.openURL('https://wa.me/5553984424244?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20app.'); }}
              >
                <View style={[styles.helpIconBox, { backgroundColor: '#27AE60' + '15' }]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#27AE60" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpItemTitle, { color: colors.text }]}>WhatsApp</Text>
                  <Text style={[styles.helpItemSub, { color: colors.textLight }]}>(53) 98442-4244</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </TouchableOpacity>

              <View style={styles.helpFaqSection}>
                <Text style={[styles.helpFaqTitle, { color: colors.text }]}>Perguntas Frequentes</Text>

                {[
                  { q: 'Como faco um pedido?', a: 'Escolha uma loja, adicione produtos ao carrinho e finalize o pedido escolhendo a forma de pagamento.' },
                  { q: 'Como me torno entregador?', a: 'No seu perfil, clique em "Quero ser entregador" e preencha o cadastro. Apos aprovacao, voce podera fazer entregas.' },
                  { q: 'Como acompanho meu pedido?', a: 'Apos realizar o pedido, voce pode acompanhar o status em tempo real na aba "Pedidos".' },
                  { q: 'Como conecto meu pagamento?', a: 'Se voce e entregador, va no perfil e clique em "Conectar Pagamento" para saber como receber os valores das entregas.' },
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
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: staticColors.white,
  },
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
    borderColor: '#65A300' + '30',
    borderStyle: 'dashed',
    gap: 12,
  },
  mpBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#65A300' + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mpBannerTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: '#65A300',
  },
  mpBannerSubtitle: {
    fontSize: fonts.small,
    color: staticColors.textLight,
    marginTop: 2,
  },
  paymentConnectedBanner: {
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
  avatarPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  avatarPickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: staticColors.grayLight,
    marginBottom: 24,
  },
  avatarPickerOptions: {
    flexDirection: 'row',
    gap: 24,
  },
  avatarPickerOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
