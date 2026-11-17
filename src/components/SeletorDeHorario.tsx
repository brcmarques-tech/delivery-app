import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@apollo/client';
import { fonts } from '../theme';
import { AVAILABLE_SLOTS, STORE_SCHEDULE } from '../lib/graphql/queries';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Escolha de dia e horário livre de um serviço — os mesmos dados da tela de
 * agendar (dias de atendimento da loja + `availableSlots`). Usado ao aceitar
 * um orçamento, que antes pedia a data digitada como texto ("AAAA-MM-DD").
 */
export function SeletorDeHorario({
  storeId,
  serviceId,
  colors,
  data,
  horario,
  onEscolher,
}: {
  storeId: string;
  serviceId: string;
  colors: any;
  data: string | null;
  horario: string | null;
  onEscolher: (data: string | null, horario: string | null) => void;
}) {
  const { data: agenda } = useQuery(STORE_SCHEDULE, { variables: { storeId }, skip: !storeId });

  const diasAtivos = useMemo(() => {
    const s = new Set<number>();
    (agenda?.storeSchedule || []).forEach((d: any) => {
      if (d.isActive) s.add(d.dayOfWeek);
    });
    return s;
  }, [agenda]);

  const dias = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);
      return {
        data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        rotulo: `${d.getDate()} ${MESES[d.getMonth()]}`,
        diaSemana: DIAS[d.getDay()],
        ativo: diasAtivos.size === 0 || diasAtivos.has(d.getDay()),
      };
    });
  }, [diasAtivos]);

  const { data: livres, loading } = useQuery(AVAILABLE_SLOTS, {
    variables: { storeId, serviceId, date: data },
    skip: !data || !storeId || !serviceId,
    fetchPolicy: 'network-only',
  });
  const horarios: string[] = livres?.availableSlots || [];

  return (
    <View>
      <Text style={[s.titulo, { color: colors.text }]}>Escolha o dia</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {dias.map((d) => {
          const marcado = data === d.data;
          return (
            <TouchableOpacity
              key={d.data}
              style={[
                s.dia,
                { backgroundColor: colors.card, borderColor: colors.grayLight },
                marcado && { backgroundColor: colors.primary, borderColor: colors.primary },
                !d.ativo && { opacity: 0.3 },
              ]}
              disabled={!d.ativo}
              onPress={() => onEscolher(d.data, null)}
            >
              <Text style={[s.diaSemana, { color: marcado ? '#fff' : colors.textLight }]}>{d.diaSemana}</Text>
              <Text style={[s.diaRotulo, { color: marcado ? '#fff' : colors.text }]}>{d.rotulo}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {data && (
        <>
          <Text style={[s.titulo, { color: colors.text }]}>Horários disponíveis</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
          ) : horarios.length === 0 ? (
            <Text style={[s.vazio, { color: colors.textLight }]}>Nenhum horário disponível neste dia</Text>
          ) : (
            <View style={s.grade}>
              {horarios.map((h) => {
                const marcado = horario === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      s.horario,
                      { backgroundColor: colors.card, borderColor: colors.grayLight },
                      marcado && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onEscolher(data, h)}
                  >
                    <Text style={[s.horarioTexto, { color: marcado ? '#fff' : colors.text }]}>{h}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: fonts.regular, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  dia: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginRight: 8, alignItems: 'center', minWidth: 60 },
  diaSemana: { fontSize: fonts.tiny, fontWeight: '600', marginBottom: 2 },
  diaRotulo: { fontSize: fonts.small, fontWeight: '700' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  horario: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  horarioTexto: { fontSize: fonts.regular, fontWeight: '600' },
  vazio: { fontSize: fonts.small, textAlign: 'center', marginVertical: 12 },
});
