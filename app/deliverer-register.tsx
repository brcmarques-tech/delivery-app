import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { REGISTER_AS_DELIVERER, UPLOAD_IMAGE } from '../src/lib/graphql/mutations';
import { useAuth } from '../src/contexts/AuthContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

const vehicleTypes = [
  { key: 'MOTO', label: 'Moto', icon: 'bicycle-outline' as const },
  { key: 'CARRO', label: 'Carro', icon: 'car-outline' as const },
  { key: 'BICICLETA', label: 'Bicicleta', icon: 'bicycle-outline' as const },
  { key: 'A_PE', label: 'A pe', icon: 'walk-outline' as const },
];

const CONTRACT_TEXT = `TERMO DE COMPROMISSO DO ENTREGADOR

Ao se cadastrar como entregador na plataforma bcmTech Delivery, você declara estar ciente e de acordo com os seguintes termos:

1. OBRIGAÇÃO DE ENTREGA: O entregador que aceitar um pedido se compromete a realizar a entrega no endereço indicado, dentro do prazo estimado pela plataforma.

2. RESPONSABILIDADE SOBRE O PRODUTO: O entregador é responsável pela integridade do produto desde o momento da coleta no estabelecimento até a entrega ao destinatário, conforme Art. 14 do Código de Defesa do Consumidor (Lei 8.078/90).

3. PENALIDADES POR NÃO ENTREGA: O entregador que aceitar um pedido e não realizar a entrega sem justificativa válida estará sujeito a:
   a) Suspensão temporária da plataforma;
   b) Bloqueio permanente em caso de reincidência;
   c) Responsabilização civil pelos prejuízos causados, conforme Arts. 186 e 927 do Código Civil (Lei 10.406/02).

4. EXTRAVIO OU DANO AO PRODUTO: Em caso de extravio, perda ou dano ao produto sob custódia do entregador, este poderá ser responsabilizado civil e criminalmente, nos termos dos Arts. 155 e 163 do Código Penal.

5. RELAÇÃO JURÍDICA: O cadastro como entregador não configura vínculo empregatício com a plataforma, nos termos do Art. 442-B da CLT, sendo o entregador profissional autônomo.

6. PROTEÇÃO DE DADOS: As informações pessoais fornecidas serão tratadas em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/18 - LGPD).

Ao prosseguir com o cadastro, você declara ter lido, compreendido e concordado com todos os termos acima.`;

export default function DelivererRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const { alert } = useAlert();
  const [birthDate, setBirthDate] = useState('');
  const [cnhNumber, setCnhNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [identityPhoto, setIdentityPhoto] = useState<string | null>(null);
  const [identityPhotoBase64, setIdentityPhotoBase64] = useState<string | null>(null);
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registerAsDeliverer, { loading }] = useMutation(REGISTER_AS_DELIVERER);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [uploading, setUploading] = useState(false);

  function formatBirthDate(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  async function pickIdentityPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissao necessaria', 'Precisamos de acesso a camera para tirar a foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      allowsEditing: false,
      base64: true,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setIdentityPhoto(result.assets[0].uri);
      setIdentityPhotoBase64(result.assets[0].base64 || null);
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissao necessaria', 'Precisamos de acesso a galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      allowsEditing: false,
      base64: true,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setIdentityPhoto(result.assets[0].uri);
      setIdentityPhotoBase64(result.assets[0].base64 || null);
    }
  }

  async function handleSubmit() {
    if (!birthDate || birthDate.length < 10) {
      alert('Erro', 'Informe sua data de nascimento');
      return;
    }
    // Parse DD/MM/YYYY to ISO
    const [dd, mm, yyyy] = birthDate.split('/');
    const birthISO = `${yyyy}-${mm}-${dd}`;
    const birthObj = new Date(birthISO);
    const age = Math.floor((Date.now() - birthObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      alert('Erro', 'Voce precisa ter pelo menos 18 anos');
      return;
    }
    if (!vehicleType) {
      alert('Erro', 'Selecione o tipo de veiculo');
      return;
    }
    if ((vehicleType === 'MOTO' || vehicleType === 'CARRO') && !cnhNumber.trim()) {
      alert('Erro', 'CNH obrigatoria para veiculos motorizados');
      return;
    }
    if (!identityPhoto) {
      alert('Erro', 'Tire uma foto segurando seu documento de identidade');
      return;
    }
    if (!acceptedContract) {
      alert('Erro', 'Voce precisa aceitar o termo de compromisso');
      return;
    }

    if (!identityPhotoBase64) {
      alert('Erro', 'Nao foi possivel processar a foto. Tente tirar novamente.');
      return;
    }

    try {
      setUploading(true);
      const { data: uploadData } = await uploadImage({
        variables: { base64: identityPhotoBase64, folder: 'identity-photos' },
      });
      const photoUrl = uploadData.uploadImage;
      setUploading(false);

      const { data } = await registerAsDeliverer({
        variables: {
          input: {
            birthDate: birthISO,
            cnhNumber: cnhNumber.trim() || undefined,
            vehicleType,
            vehiclePlate: vehiclePlate || undefined,
            identityPhotoUrl: photoUrl,
          },
        },
      });

      await updateUser(data.registerAsDeliverer);
      setSubmitted(true);
    } catch (err: any) {
      setUploading(false);
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Erro desconhecido';
      alert('Erro', `Não foi possível completar o cadastro: ${msg}`);
    }
  }

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Cadastro enviado!</Text>
        <Text style={styles.successSubtitle}>
          Seu cadastro como entregador foi enviado e está aguardando aprovação do administrador.
          Você será notificado quando for aprovado.
        </Text>
        <TouchableOpacity
          style={styles.successButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.successButtonText}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
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
        <Text style={styles.label}>Data de nascimento</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.gray}
          value={birthDate}
          onChangeText={(v) => setBirthDate(formatBirthDate(v))}
          keyboardType="numeric"
          maxLength={10}
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
            <Text style={styles.label}>Numero da CNH</Text>
            <TextInput
              style={styles.input}
              placeholder="00000000000"
              placeholderTextColor={colors.gray}
              value={cnhNumber}
              onChangeText={setCnhNumber}
              keyboardType="numeric"
              maxLength={11}
            />

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
              onPress={() => { setIdentityPhoto(null); setIdentityPhotoBase64(null); }}
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
          style={[styles.submitButton, (loading || uploading || !acceptedContract) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploading || !acceptedContract}
        >
          <Text style={styles.submitButtonText}>
            {uploading ? 'Enviando foto...' : loading ? 'Enviando cadastro...' : 'Enviar cadastro'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  successContainer: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  successButtonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
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
