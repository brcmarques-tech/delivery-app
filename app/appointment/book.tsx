import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { fonts } from '../../src/theme';
import { AVAILABLE_SLOTS, STORE_SCHEDULE } from '../../src/lib/graphql/queries';
import { CREATE_APPOINTMENT } from '../../src/lib/graphql/mutations';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function BookAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { alert } = useAlert();
  const { storeId, serviceId, serviceName, servicePrice, serviceDuration } = useLocalSearchParams<{
    storeId: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    serviceDuration: string;
  }>();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ON_SERVICE' | 'PIX'>('ON_SERVICE');

  // Get store schedule to know which days are active
  const { data: scheduleData } = useQuery(STORE_SCHEDULE, {
    variables: { storeId },
  });

  const activeDays = useMemo(() => {
    const days = new Set<number>();
    (scheduleData?.storeSchedule || []).forEach((s: any) => {
      if (s.isActive) days.add(s.dayOfWeek);
    });
    return days;
  }, [scheduleData]);

  // Generate next 30 days
  const dates = useMemo(() => {
    const result: { date: string; label: string; dayLabel: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      result.push({
        date: dateStr,
        label: `${d.getDate()} ${MONTHS_PT[d.getMonth()]}`,
        dayLabel: DAYS_PT[dayOfWeek],
        active: activeDays.size === 0 || activeDays.has(dayOfWeek),
      });
    }
    return result;
  }, [activeDays]);

  // Fetch available slots when a date is selected
  const { data: slotsData, loading: slotsLoading } = useQuery(AVAILABLE_SLOTS, {
    variables: { storeId, serviceId, date: selectedDate },
    skip: !selectedDate,
    fetchPolicy: 'network-only',
  });

  const slots: string[] = slotsData?.availableSlots || [];

  const [createAppointment, { loading: creating }] = useMutation(CREATE_APPOINTMENT);
  // Trava SÍNCRONA contra double-tap: `disabled={creating}` só vira true no
  // próximo render, tarde demais para um toque duplo rápido, que gerava dois
  // agendamentos (e dois QR Codes/cobranças PIX). O ref muda no mesmo tick.
  const submittingRef = useRef(false);

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const result = await createAppointment({
        variables: {
          input: {
            storeId,
            serviceId,
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            notes: notes || undefined,
            paymentMethod,
          },
        },
      });
      const apt = result.data?.createAppointment;
      if (paymentMethod === 'PIX' && apt?.pixQrCode) {
        alert('Agendamento criado!', 'Escaneie o QR Code PIX para pagar.');
        router.replace(`/appointment/${apt.id}`);
      } else if (paymentMethod !== 'ON_SERVICE' && apt?.checkoutUrl) {
        alert('Agendamento criado!', 'Complete o pagamento para confirmar.');
        router.replace(`/appointment/${apt.id}`);
      } else {
        alert('Agendamento criado!', `${serviceName} em ${selectedDate} as ${selectedTime}`);
        router.back();
      }
    } catch (err: any) {
      alert('Erro', err?.message || 'Nao foi possivel agendar. Tente novamente.');
    } finally {
      submittingRef.current = false;
    }
  }

  const price = servicePrice ? Number(servicePrice) : null;
  const duration = serviceDuration ? Number(serviceDuration) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Agendar</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {/* Service summary */}
        <View style={[styles.serviceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.serviceName, { color: colors.text }]}>{serviceName}</Text>
          <View style={styles.serviceDetails}>
            {price != null && (
              <View style={styles.detailChip}>
                <Ionicons name="cash-outline" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.primary }]}>R$ {price.toFixed(2)}</Text>
              </View>
            )}
            {duration != null && (
              <View style={styles.detailChip}>
                <Ionicons name="time-outline" size={14} color={colors.gray} />
                <Text style={[styles.detailText, { color: colors.textLight }]}>{duration} min</Text>
              </View>
            )}
          </View>
        </View>

        {/* Date picker */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Escolha o dia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dates.map((d) => (
            <TouchableOpacity
              key={d.date}
              style={[
                styles.dateChip,
                { backgroundColor: colors.card, borderColor: colors.grayLight },
                selectedDate === d.date && { backgroundColor: colors.primary, borderColor: colors.primary },
                !d.active && { opacity: 0.3 },
              ]}
              onPress={() => {
                if (!d.active) return;
                setSelectedDate(d.date);
                setSelectedTime(null);
              }}
              disabled={!d.active}
            >
              <Text style={[styles.dateDayLabel, { color: selectedDate === d.date ? '#fff' : colors.textLight }]}>
                {d.dayLabel}
              </Text>
              <Text style={[styles.dateLabel, { color: selectedDate === d.date ? '#fff' : colors.text }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time slots */}
        {selectedDate && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Horarios disponiveis</Text>
            {slotsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
            ) : slots.length === 0 ? (
              <Text style={[styles.noSlots, { color: colors.textLight }]}>
                Nenhum horario disponivel neste dia
              </Text>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.slotChip,
                      { backgroundColor: colors.card, borderColor: colors.grayLight },
                      selectedTime === time && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.slotText, { color: selectedTime === time ? '#fff' : colors.text }]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Notes */}
        {selectedTime && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Observacoes (opcional)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.grayLight }]}
              placeholder="Algo que o prestador precisa saber?"
              placeholderTextColor={colors.gray}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </>
        )}

        {/* Payment method */}
        {selectedTime && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Forma de pagamento</Text>
            <View style={styles.paymentOptions}>
              {([
                { key: 'ON_SERVICE', label: 'Pagar no local', icon: 'cash-outline' },
                { key: 'PIX', label: 'PIX', icon: 'qr-code-outline' },
              ] as const).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.paymentChip,
                    { backgroundColor: colors.card, borderColor: colors.grayLight },
                    paymentMethod === opt.key && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
                  ]}
                  onPress={() => setPaymentMethod(opt.key)}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={paymentMethod === opt.key ? colors.primary : colors.gray}
                  />
                  <Text style={[
                    styles.paymentLabel,
                    { color: paymentMethod === opt.key ? colors.primary : colors.text },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Confirm button */}
      {selectedDate && selectedTime && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmText}>Confirmar agendamento</Text>
                {price != null && (
                  <Text style={styles.confirmPrice}>R$ {price.toFixed(2)}</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  content: { padding: 12 },
  serviceCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  serviceName: { fontSize: fonts.large, fontWeight: '700' },
  serviceDetails: { flexDirection: 'row', gap: 12, marginTop: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: fonts.small, fontWeight: '600' },
  sectionTitle: { fontSize: fonts.regular, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  dateScroll: { marginBottom: 8 },
  dateChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  dateDayLabel: { fontSize: fonts.tiny, fontWeight: '600', marginBottom: 2 },
  dateLabel: { fontSize: fonts.small, fontWeight: '700' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  slotText: { fontSize: fonts.regular, fontWeight: '600' },
  noSlots: { fontSize: fonts.small, textAlign: 'center', marginTop: 16 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  confirmBtn: {
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmText: { color: '#fff', fontSize: fonts.large, fontWeight: 'bold' },
  confirmPrice: { color: '#fff', fontSize: fonts.large, fontWeight: 'bold' },
  paymentOptions: { flexDirection: 'row', gap: 10 },
  paymentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
  },
  paymentLabel: { fontSize: fonts.regular, fontWeight: '600' },
});
