import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { REGISTER_AS_DELIVERER } from '../src/lib/graphql/mutations';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, fonts } from '../src/theme';

const vehicleTypes = [
  { key: 'MOTO', label: 'Moto', icon: 'bicycle-outline' as const },
  { key: 'CARRO', label: 'Carro', icon: 'car-outline' as const },
  { key: 'BICICLETA', label: 'Bicicleta', icon: 'bicycle-outline' as const },
  { key: 'A_PE', label: 'A pe', icon: 'walk-outline' as const },
];

const CONTRACT_TEXT = `TERMO DE COMPROMISSO DO ENTREGADOR

Ao se cadastrar como entregador na plataforma bcmTech Delivery, voce declara estar ciente e de acordo com os seguintes termos:

1. OBRIGACAO DE ENTREGA: O entregador que aceitar um pedido se compromete a realizar a entrega no endereco indicado, dentro do prazo estimado pela plataforma.

2. RESPONSABILIDADE SOBRE O PRODUTO: O entregador e responsavel pela integridade do produto desde o momento da coleta no estabelecimento ate a entrega ao destinatario, conforme Art. 14 do Codigo de Defesa do Consumidor (Lei 8.078/90).

3. PENALIDADES POR NAO ENTREGA: O entregador que aceitar um pedido e nao realizar a entrega sem justificativa valida estara sujeito a:
   a) Suspensao temporaria da plataforma;
   b) Bloqueio permanente em caso de reincidencia;
   c) Responsabilizacao civil pelos prejuizos causados, conforme Arts. 186 e 927 do Codigo Civil (Lei 10.406/02).

4. EXTRAVIO OU DANO AO PRODUTO: Em caso de extravio, perda ou dano ao produto sob custodia do entregador, este podera ser responsabilizado civil e criminalmente, nos termos dos Arts. 155 e 163 do Codigo Penal.

5. RELACAO JURIDICA: O cadastro como entregador nao configura vinculo empregaticio com a plataforma, nos termos do Art. 442-B da CLT, sendo o entregador profissional autonomo.

6. PROTECAO DE DADOS: As informacoes pessoais fornecidas serao tratadas em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/18 - LGPD).

Ao prosseguir com o cadastro, voce declara ter lido, compreendido e concordado com todos os termos acima.`;

export default function DelivererRegisterScreen() {
  const { updateUser } = useAuth();
  const [cpf, setCpf] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [identityPhoto, setIdentityPhoto] = useState<string | null>(null);
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [registerAsDeliverer, { loading }] = useMutation(REGISTER_AS_DELIVERER);

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  async function pickIdentityPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a camera para tirar a foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setIdentityPhoto(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setIdentityPhoto(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      Alert.alert('Erro', 'CPF deve ter 11 digitos');
      return;
    }
    if (!vehicleType) {
      Alert.alert('Erro', 'Selecione o tipo de veiculo');
      return;
    }
    if (!identityPhoto) {
      Alert.alert('Erro', 'Tire uma foto segurando seu documento de identidade');
      return;
    }
    if (!acceptedContract) {
      Alert.alert('Erro', 'Voce precisa aceitar o termo de compromisso');
      return;
    }

    try {
      const { data } = await registerAsDeliverer({
        variables: {
          input: {
            cpf: cleanCpf,
            vehicleType,
            vehiclePlate: vehiclePlate || undefined,
            identityPhotoUrl: identityPhoto,
          },
        },
      });

      await updateUser(data.registerAsDeliverer);
      Alert.alert(
        'Cadastro enviado!',
        'Seu cadastro como entregador foi enviado e esta aguardando aprovacao do administrador. Voce sera notificado quando for aprovado.',
        [{ text: 'OK', onPress: () => router.replace('/') }],
      );
    } catch {
      Alert.alert('Erro', 'Nao foi possivel completar o cadastro. Tente novamente.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Ionicons name="bicycle" size={48} color={colors.primary} />
      </View>

      <Text style={styles.title}>Quero ser entregador</Text>
      <Text style={styles.subtitle}>
        Preencha seus dados para comecar a fazer entregas e ganhar dinheiro
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={styles.input}
          placeholder="000.000.000-00"
          placeholderTextColor={colors.gray}
          value={cpf}
          onChangeText={(v) => setCpf(formatCpf(v))}
          keyboardType="numeric"
          maxLength={14}
        />

        <Text style={styles.label}>Tipo de veiculo</Text>
        <View style={styles.vehicleContainer}>
          {vehicleTypes.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.vehicleButton,
                vehicleType === v.key && styles.vehicleButtonActive,
              ]}
              onPress={() => setVehicleType(v.key)}
            >
              <Ionicons
                name={v.icon}
                size={24}
                color={vehicleType === v.key ? colors.primary : colors.gray}
              />
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === v.key && styles.vehicleTextActive,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(vehicleType === 'MOTO' || vehicleType === 'CARRO') && (
          <>
            <Text style={styles.label}>Placa do veiculo</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC-1234"
              placeholderTextColor={colors.gray}
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              autoCapitalize="characters"
              maxLength={8}
            />
          </>
        )}

        {/* Foto com identidade */}
        <Text style={styles.label}>Foto segurando identidade</Text>
        <Text style={styles.photoHint}>
          Tire uma foto segurando seu documento de identidade (RG ou CNH) ao lado do rosto
        </Text>

        {identityPhoto ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: identityPhoto }} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setIdentityPhoto(null)}
            >
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={pickIdentityPhoto}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contrato */}
        <View style={styles.contractSection}>
          <TouchableOpacity
            style={styles.contractHeader}
            onPress={() => setShowContract(!showContract)}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.text}
            />
            <Text style={styles.contractHeaderText}>Termo de compromisso do entregador</Text>
            <Ionicons
              name={showContract ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gray}
            />
          </TouchableOpacity>

          {showContract && (
            <ScrollView style={styles.contractBody} nestedScrollEnabled>
              <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcceptedContract(!acceptedContract)}
          >
            <Ionicons
              name={acceptedContract ? 'checkbox' : 'square-outline'}
              size={24}
              color={acceptedContract ? colors.primary : colors.gray}
            />
            <Text style={styles.checkboxText}>
              Li e aceito o termo de compromisso do entregador
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (loading || !acceptedContract) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !acceptedContract}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Enviando cadastro...' : 'Enviar cadastro'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  backButton: { marginBottom: 16 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 22,
  },
  form: { gap: 8 },
  label: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
  },
  vehicleContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  vehicleButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grayLight,
    alignItems: 'center',
    gap: 6,
  },
  vehicleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  vehicleText: {
    fontSize: fonts.small,
    color: colors.textLight,
    fontWeight: '600',
  },
  vehicleTextActive: { color: colors.primary },
  photoHint: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 18,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.grayLight,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
  },
  contractSection: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: colors.grayLight,
  },
  contractHeaderText: {
    flex: 1,
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
  },
  contractBody: {
    maxHeight: 200,
    padding: 14,
    backgroundColor: colors.white,
  },
  contractText: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  checkboxText: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
});
