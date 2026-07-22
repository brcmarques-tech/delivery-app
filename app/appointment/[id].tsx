import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Clipboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAlert } from '../../src/contexts/AlertContext';
import {
  GET_APPOINTMENT,
  RATING_FOR_APPOINTMENT,
  AVAILABLE_SLOTS,
} from '../../src/lib/graphql/queries';
import {
  CANCEL_APPOINTMENT,
  ACCEPT_QUOTE,
  REJECT_QUOTE,
  RATE_SERVICE,
} from '../../src/lib/graphql/mutations';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluido',
  NO_SHOW: 'Nao compareceu',
  QUOTE_REQUESTED: 'Orcamento solicitado',
  QUOTED: 'Orcamento recebido',
  QUOTE_ACCEPTED: 'Orcamento aceito',
  QUOTE_REJECTED: 'Orcamento recusado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  CANCELLED: '#EF4444',
  COMPLETED: '#10B981',
  NO_SHOW: '#6B7280',
  QUOTE_REQUESTED: '#8B5CF6',
  QUOTED: '#F59E0B',
  QUOTE_ACCEPTED: '#10B981',
  QUOTE_REJECTED: '#EF4444',
};

export default function AppointmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { alert: showAlert } = useAlert();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Quote accept state
  const [showQuoteAccept, setShowQuoteAccept] = useState(false);
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteTime, setQuoteTime] = useState('');

  const { data, loading, refetch } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    skip: !id,
  });

  const { data: ratingData } = useQuery(RATING_FOR_APPOINTMENT, {
    variables: { appointmentId: id },
    skip: !id,
  });

  const [cancelAppointment, { loading: cancelling }] = useMutation(CANCEL_APPOINTMENT, {
    onCompleted: () => {
      showAlert('Sucesso', 'Agendamento cancelado');
      refetch();
    },
    onError: (e) => showAlert('Erro', e.message),
  });

  const [acceptQuote, { loading: accepting }] = useMutation(ACCEPT_QUOTE, {
    onCompleted: () => {
      showAlert('Sucesso', 'Orcamento aceito! Agendamento criado.');
      setShowQuoteAccept(false);
      refetch();
    },
    onError: (e) => showAlert('Erro', e.message),
  });

  const [rejectQuote, { loading: rejecting }] = useMutation(REJECT_QUOTE, {
    onCompleted: () => {
      showAlert('Sucesso', 'Orcamento recusado');
      refetch();
    },
    onError: (e) => showAlert('Erro', e.message),
  });

  const [rateService, { loading: rating }] = useMutation(RATE_SERVICE, {
    onCompleted: () => {
      showAlert('Sucesso', 'Avaliacao enviada!');
      setShowRating(false);
      refetch();
    },
    onError: (e) => showAlert('Erro', e.message),
  });

  const apt = data?.appointment;
  const existingRating = ratingData?.ratingForAppointment;

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!apt) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Agendamento nao encontrado</Text>
      </View>
    );
  }

  const canCancel = ['PENDING', 'CONFIRMED', 'QUOTE_REQUESTED'].includes(apt.status);
  const isQuoted = apt.status === 'QUOTED';
  const canRate = apt.status === 'COMPLETED' && !existingRating;

  const handleCancel = () => {
    Alert.alert('Cancelar agendamento', 'Tem certeza?', [
      { text: 'Nao', style: 'cancel' },
      { text: 'Sim, cancelar', style: 'destructive', onPress: () => cancelAppointment({ variables: { id } }) },
    ]);
  };

  const handleAcceptQuote = () => {
    if (!quoteDate || !quoteTime) {
      showAlert('Erro', 'Selecione data e horario');
      return;
    }
    acceptQuote({ variables: { id, scheduledDate: quoteDate, scheduledTime: quoteTime } });
  };

  const handleRate = () => {
    if (ratingValue === 0) {
      showAlert('Erro', 'Selecione uma nota');
      return;
    }
    rateService({
      variables: {
        input: {
          appointmentId: id,
          rating: ratingValue,
          comment: ratingComment || undefined,
        },
      },
    });
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Agendamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Status badge */}
        <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[apt.status] + '20' }]}>
          <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[apt.status] }]} />
          <Text style={[s.statusText, { color: STATUS_COLORS[apt.status] }]}>
            {STATUS_LABELS[apt.status] || apt.status}
          </Text>
        </View>

        {/* Appointment number */}
        <Text style={[s.aptNumber, { color: colors.textSecondary }]}>{apt.appointmentNumber}</Text>

        {/* Service info */}
        <View style={[s.card, { backgroundColor: colors.card }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>{apt.service?.name}</Text>
          {apt.service?.description ? (
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>{apt.service.description}</Text>
          ) : null}
          <View style={s.row}>
            <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
            <Text style={[s.rowText, { color: colors.textSecondary }]}>{apt.store?.name}</Text>
          </View>
          {apt.scheduledDate ? (
            <View style={s.row}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[s.rowText, { color: colors.textSecondary }]}>
                {apt.scheduledDate} as {apt.scheduledTime} - {apt.endTime}
              </Text>
            </View>
          ) : null}
          {apt.price != null ? (
            <View style={s.row}>
              <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
              <Text style={[s.rowText, { color: colors.text, fontWeight: '600' }]}>
                R$ {Number(apt.price).toFixed(2)}
              </Text>
            </View>
          ) : null}
          {apt.service?.estimatedDuration ? (
            <View style={s.row}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[s.rowText, { color: colors.textSecondary }]}>
                {apt.service.estimatedDuration} min
              </Text>
            </View>
          ) : null}
        </View>

        {/* Notes */}
        {apt.notes ? (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Observacoes</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>{apt.notes}</Text>
          </View>
        ) : null}

        {/* Address */}
        {apt.address ? (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Endereco</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>{apt.address}</Text>
          </View>
        ) : null}

        {/* Payment info */}
        {apt.paymentMethod && apt.paymentMethod !== 'ON_SERVICE' && (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Pagamento</Text>
            <View style={s.row}>
              <Ionicons name={apt.paymentMethod === 'PIX' ? 'qr-code-outline' : 'card-outline'} size={16} color={colors.textSecondary} />
              <Text style={[s.rowText, { color: colors.textSecondary }]}>
                {apt.paymentMethod === 'PIX' ? 'PIX' : 'Cartao de credito'}
                {' — '}
                {apt.paymentStatus === 'PAID' ? 'Pago' : apt.paymentStatus === 'FAILED' ? 'Falhou' : 'Aguardando pagamento'}
              </Text>
            </View>
            {apt.paymentStatus === 'AWAITING_PAYMENT' && apt.pixQrCode && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#10B981', marginTop: 12 }]}
                onPress={() => {
                  Clipboard.setString(apt.pixQrCode);
                  showAlert('Copiado', 'Codigo PIX copiado!');
                }}
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Copiar codigo PIX</Text>
              </TouchableOpacity>
            )}
            {apt.paymentStatus === 'AWAITING_PAYMENT' && apt.checkoutUrl && !apt.pixQrCode && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
                onPress={() => Linking.openURL(apt.checkoutUrl)}
              >
                <Ionicons name="open-outline" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Abrir pagamento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quote info */}
        {apt.quoteDescription ? (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Descricao do orcamento</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>{apt.quoteDescription}</Text>
          </View>
        ) : null}
        {apt.quoteResponse ? (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Resposta do prestador</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>{apt.quoteResponse}</Text>
          </View>
        ) : null}

        {/* Quote actions */}
        {isQuoted && !showQuoteAccept && (
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={() => setShowQuoteAccept(true)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.actionBtnText}>Aceitar orcamento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => rejectQuote({ variables: { id } })}
              disabled={rejecting}
            >
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={s.actionBtnText}>Recusar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Accept quote form */}
        {showQuoteAccept && (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Escolha data e horario</Text>
            <TextInput
              style={[s.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Data (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={quoteDate}
              onChangeText={setQuoteDate}
            />
            <TextInput
              style={[s.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Horario (HH:MM)"
              placeholderTextColor={colors.textSecondary}
              value={quoteTime}
              onChangeText={setQuoteTime}
            />
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={handleAcceptQuote}
              disabled={accepting}
            >
              {accepting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.actionBtnText}>Confirmar horario</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel button */}
        {canCancel && (
          <TouchableOpacity
            style={[s.cancelBtn, { borderColor: '#EF4444' }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <Text style={s.cancelBtnText}>Cancelar agendamento</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Existing rating */}
        {existingRating && (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Sua avaliacao</Text>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= existingRating.rating ? 'star' : 'star-outline'}
                  size={24}
                  color="#F59E0B"
                />
              ))}
            </View>
            {existingRating.comment ? (
              <Text style={{ color: colors.textSecondary, fontWeight: '400', marginTop: 8 }}>
                {existingRating.comment}
              </Text>
            ) : null}
          </View>
        )}

        {/* Rate button */}
        {canRate && !showRating && (
          <TouchableOpacity
            style={[s.rateBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowRating(true)}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={s.rateBtnText}>Avaliar servico</Text>
          </TouchableOpacity>
        )}

        {/* Rating form */}
        {showRating && (
          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Como foi o servico?</Text>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                  <Ionicons
                    name={star <= ratingValue ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[s.input, s.textArea, { borderColor: colors.border, color: colors.text }]}
              placeholder="Comentario (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleRate}
              disabled={rating}
            >
              {rating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.actionBtnText}>Enviar avaliacao</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontWeight: '700', fontSize: 18 },
  content: { flex: 1, paddingHorizontal: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontWeight: '600', fontSize: 14 },
  aptNumber: { fontWeight: '400', fontSize: 13, marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontWeight: '700', fontSize: 18, marginBottom: 4 },
  cardDesc: { fontWeight: '400', fontSize: 14, marginBottom: 12 },
  sectionTitle: { fontWeight: '600', fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rowText: { fontWeight: '400', fontSize: 14, marginLeft: 8 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  actionBtnText: { fontWeight: '600', fontSize: 15, color: '#fff' },
  cancelBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  cancelBtnText: { fontWeight: '600', fontSize: 15, color: '#EF4444' },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 12 },
  rateBtnText: { fontWeight: '600', fontSize: 15, color: '#fff' },
  stars: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontWeight: '400', fontSize: 15, marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
});
