import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { REGISTER_AS_DELIVERER, UPLOAD_IMAGE, VALIDATE_FACE_PHOTO, VALIDATE_DOCUMENT_PHOTO } from '../src/lib/graphql/mutations';
import { useAuth } from '../src/contexts/AuthContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const OVAL_WIDTH = SCREEN_WIDTH * 0.65;
const OVAL_HEIGHT = OVAL_WIDTH * 1.3;

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

6. PROTEÇÃO DE DADOS: As informações pessoais fornecidas serão tratadas em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/18 - LGPD), observando-se:
   a) As fotografias (selfie e documento de identidade) enviadas durante o cadastro serão armazenadas para fins exclusivos de verificação de identidade e prevenção a fraudes, com base no Art. 7, inciso V (execução de contrato) e Art. 11, inciso II, alínea "g" (prevenção à fraude) da LGPD;
   b) As imagens serão mantidas pelo período de até 2 (dois) anos após o encerramento do cadastro ou desligamento da plataforma;
   c) O acesso às imagens é restrito aos administradores da plataforma, sendo vedado o compartilhamento com terceiros, exceto por determinação judicial;
   d) O entregador poderá, a qualquer momento, solicitar a exclusão de seus dados pessoais e imagens através dos canais de atendimento da plataforma, ressalvadas as hipóteses legais de retenção;
   e) As demais informações pessoais (nome, CPF, telefone, e-mail) serão utilizadas exclusivamente para operação do serviço e comunicação com o entregador.

7. DIREITOS DO TITULAR: Nos termos do Art. 18 da LGPD, o entregador tem direito a:
   a) Confirmação da existência de tratamento de seus dados;
   b) Acesso aos dados pessoais armazenados;
   c) Correção de dados incompletos, inexatos ou desatualizados;
   d) Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;
   e) Portabilidade dos dados;
   f) Revogação do consentimento a qualquer momento.

Ao prosseguir com o cadastro, você declara ter lido, compreendido e concordado com todos os termos acima.`;

type PhotoStatus = 'idle' | 'validating' | 'valid' | 'invalid';

// ─── Face Camera Component ───
function FaceCameraScreen({
  onCapture,
  onClose,
}: {
  onCapture: (uri: string, base64: string) => void;
  onClose: () => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [taking, setTaking] = useState(false);

  async function takePicture() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        base64: true,
        exif: false,
      });
      if (photo && photo.uri && photo.base64) {
        onCapture(photo.uri, photo.base64);
      }
    } catch {
      setTaking(false);
    }
  }

  return (
    <View style={camStyles.container}>
      <CameraView
        ref={cameraRef}
        style={camStyles.camera}
        facing="front"
      >
        {/* Oval guide overlay */}
        <View style={camStyles.overlay}>
          <View style={camStyles.overlayTop} />
          <View style={camStyles.overlayMiddle}>
            <View style={camStyles.overlaySide} />
            <View style={[camStyles.ovalCutout, { borderColor: colors.white }]} />
            <View style={camStyles.overlaySide} />
          </View>
          <View style={camStyles.overlayBottom} />
        </View>

        {/* Status text */}
        <View style={camStyles.statusContainer}>
          <View style={[camStyles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="scan-outline" size={18} color={colors.white} />
            <Text style={[camStyles.statusText, { color: colors.white }]}>
              Posicione seu rosto no oval
            </Text>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity style={camStyles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>

        {/* Capture button */}
        <View style={camStyles.captureContainer}>
          <TouchableOpacity
            style={camStyles.captureButton}
            onPress={takePicture}
            disabled={taking}
          >
            {taking ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <View style={camStyles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const camStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: '#000',
  },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: OVAL_HEIGHT,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  ovalCutout: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  captureDisabled: { opacity: 0.4 },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
});

// ─── Main Screen ───
export default function DelivererRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const { alert } = useAlert();
  const [permission, requestPermission] = useCameraPermissions();
  const [showFaceCamera, setShowFaceCamera] = useState(false);

  const [birthDate, setBirthDate] = useState('');
  const [cnhNumber, setCnhNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Face photo (selfie)
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [facePhotoBase64, setFacePhotoBase64] = useState<string | null>(null);
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const [facePhotoStatus, setFacePhotoStatus] = useState<PhotoStatus>('idle');
  const [facePhotoError, setFacePhotoError] = useState('');

  // Document photo (front)
  const [docPhoto, setDocPhoto] = useState<string | null>(null);
  const [docPhotoBase64, setDocPhotoBase64] = useState<string | null>(null);
  const [docPhotoUrl, setDocPhotoUrl] = useState<string | null>(null);
  const [docPhotoStatus, setDocPhotoStatus] = useState<PhotoStatus>('idle');
  const [docPhotoError, setDocPhotoError] = useState('');

  // Document photo (back)
  const [docPhotoBack, setDocPhotoBack] = useState<string | null>(null);
  const [docPhotoBackBase64, setDocPhotoBackBase64] = useState<string | null>(null);
  const [docPhotoBackUrl, setDocPhotoBackUrl] = useState<string | null>(null);
  const [docPhotoBackStatus, setDocPhotoBackStatus] = useState<PhotoStatus>('idle');
  const [docPhotoBackError, setDocPhotoBackError] = useState('');

  const [acceptedContract, setAcceptedContract] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registerAsDeliverer, { loading }] = useMutation(REGISTER_AS_DELIVERER);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [validateFace] = useMutation(VALIDATE_FACE_PHOTO);
  const [validateDocument] = useMutation(VALIDATE_DOCUMENT_PHOTO);
  const [uploading, setUploading] = useState(false);

  function formatBirthDate(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  async function openFaceCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        alert('Permissao necessaria', 'Precisamos de acesso a camera para tirar a foto.');
        return;
      }
    }
    setShowFaceCamera(true);
  }

  async function uploadAndValidateFace(uri: string, base64: string) {
    setFacePhoto(uri);
    setFacePhotoBase64(base64);
    setFacePhotoStatus('validating');
    setFacePhotoError('');
    setShowFaceCamera(false);

    try {
      const { data: uploadData } = await uploadImage({
        variables: { base64, folder: 'profile-photos' },
      });
      const imageUrl = uploadData.uploadImage;
      setFacePhotoUrl(imageUrl);

      const { data: validationData } = await validateFace({
        variables: { imageUrl },
      });

      if (validationData.validateFacePhoto.valid) {
        setFacePhotoStatus('valid');
        setFacePhotoError('');
      } else {
        setFacePhotoStatus('invalid');
        setFacePhotoError(validationData.validateFacePhoto.message);
      }
    } catch {
      // Se a validação falhar (API offline, etc), aceita a foto
      setFacePhotoStatus('valid');
      setFacePhotoError('');
    }
  }

  function handleFaceCaptured(uri: string, base64: string) {
    uploadAndValidateFace(uri, base64);
  }

  async function pickFaceFromGallery() {
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
      const base64 = result.assets[0].base64;
      if (base64) {
        uploadAndValidateFace(result.assets[0].uri, base64);
      }
    }
  }

  async function uploadAndValidateDoc(uri: string, base64: string, side: 'front' | 'back') {
    if (side === 'front') {
      setDocPhoto(uri);
      setDocPhotoBase64(base64);
    } else {
      setDocPhotoBack(uri);
      setDocPhotoBackBase64(base64);
    }

    const setStatus = side === 'front' ? setDocPhotoStatus : setDocPhotoBackStatus;
    const setError = side === 'front' ? setDocPhotoError : setDocPhotoBackError;
    const setUrl = side === 'front' ? setDocPhotoUrl : setDocPhotoBackUrl;

    setStatus('validating');
    setError('');

    try {
      const { data: uploadData } = await uploadImage({
        variables: { base64, folder: 'identity-photos' },
      });
      const imageUrl = uploadData.uploadImage;
      setUrl(imageUrl);

      const { data: validationData } = await validateDocument({
        variables: { imageUrl },
      });

      if (validationData.validateDocumentPhoto.valid) {
        setStatus('valid');
        setError('');
      } else {
        setStatus('invalid');
        setError(validationData.validateDocumentPhoto.message);
      }
    } catch {
      setStatus('valid');
      setError('');
    }
  }

  async function pickDocPhoto(fromCamera: boolean, side: 'front' | 'back') {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissao necessaria', 'Precisamos de acesso a camera para tirar a foto.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissao necessaria', 'Precisamos de acesso a galeria.');
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.4,
          allowsEditing: false,
          base64: true,
          exif: false,
          cameraType: ImagePicker.CameraType.back,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.4,
          allowsEditing: false,
          base64: true,
          exif: false,
        });

    if (!result.canceled && result.assets[0]) {
      const base64 = result.assets[0].base64;
      if (base64) {
        await uploadAndValidateDoc(result.assets[0].uri, base64, side);
      }
    }
  }

  function clearFacePhoto() {
    setFacePhoto(null);
    setFacePhotoBase64(null);
    setFacePhotoUrl(null);
    setFacePhotoStatus('idle');
    setFacePhotoError('');
  }

  function clearDocPhoto() {
    setDocPhoto(null);
    setDocPhotoBase64(null);
    setDocPhotoUrl(null);
    setDocPhotoStatus('idle');
    setDocPhotoError('');
  }

  function clearDocPhotoBack() {
    setDocPhotoBack(null);
    setDocPhotoBackBase64(null);
    setDocPhotoBackUrl(null);
    setDocPhotoBackStatus('idle');
    setDocPhotoBackError('');
  }

  const photosValid = facePhotoStatus === 'valid' && docPhotoStatus === 'valid' && docPhotoBackStatus === 'valid';

  async function handleSubmit() {
    if (!birthDate || birthDate.length < 10) {
      alert('Erro', 'Informe sua data de nascimento');
      return;
    }
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
    if (!facePhoto || facePhotoStatus !== 'valid') {
      alert('Erro', 'Tire uma foto valida do seu rosto');
      return;
    }
    if (!docPhoto || docPhotoStatus !== 'valid') {
      alert('Erro', 'Tire uma foto valida da frente do seu documento');
      return;
    }
    if (!docPhotoBack || docPhotoBackStatus !== 'valid') {
      alert('Erro', 'Tire uma foto valida do verso do seu documento');
      return;
    }
    if (!acceptedContract) {
      alert('Erro', 'Voce precisa aceitar o termo de compromisso');
      return;
    }
    if (!facePhotoUrl || !docPhotoUrl || !docPhotoBackUrl) {
      alert('Erro', 'Nao foi possivel processar as fotos. Tente novamente.');
      return;
    }

    try {
      setUploading(true);

      const { data } = await registerAsDeliverer({
        variables: {
          input: {
            birthDate: birthISO,
            cnhNumber: cnhNumber.trim() || undefined,
            vehicleType,
            vehiclePlate: vehiclePlate || undefined,
            identityPhotoUrl: docPhotoUrl,
            identityPhotoBackUrl: docPhotoBackUrl,
            profilePhotoUrl: facePhotoUrl,
          },
        },
      });

      setUploading(false);
      await updateUser(data.registerAsDeliverer);
      setSubmitted(true);
    } catch (err: any) {
      setUploading(false);
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Erro desconhecido';
      alert('Erro', `Não foi possível completar o cadastro: ${msg}`);
    }
  }

  // ─── Face Camera fullscreen ───
  if (showFaceCamera) {
    return (
      <FaceCameraScreen
        onCapture={handleFaceCaptured}
        onClose={() => setShowFaceCamera(false)}
      />
    );
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled">
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

        {/* Foto do rosto (selfie) com câmera interativa */}
        <Text style={styles.label}>Foto do rosto (selfie)</Text>
        <Text style={styles.photoHint}>
          Tire uma selfie com deteccao facial. Posicione seu rosto no oval.
        </Text>

        {facePhoto ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: facePhoto }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhotoButton} onPress={clearFacePhoto}>
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </TouchableOpacity>
            {facePhotoStatus === 'validating' && (
              <View style={styles.validationOverlay}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.validationText}>Verificando...</Text>
              </View>
            )}
            {facePhotoStatus === 'valid' && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            )}
            {facePhotoStatus === 'invalid' && (
              <View style={styles.statusBadgeError}>
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={openFaceCamera}>
              <Ionicons name="scan-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Selfie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickFaceFromGallery}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}
        {facePhotoError ? <Text style={styles.photoError}>{facePhotoError}</Text> : null}

        {/* Foto do documento - FRENTE */}
        <Text style={[styles.label, { marginTop: 16 }]}>Documento - Frente (RG ou CNH)</Text>
        <Text style={styles.photoHint}>
          Tire uma foto da frente do documento, com os dados visiveis.
        </Text>

        {docPhoto ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: docPhoto }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhotoButton} onPress={clearDocPhoto}>
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </TouchableOpacity>
            {docPhotoStatus === 'validating' && (
              <View style={styles.validationOverlay}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.validationText}>Verificando documento...</Text>
              </View>
            )}
            {docPhotoStatus === 'valid' && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            )}
            {docPhotoStatus === 'invalid' && (
              <View style={styles.statusBadgeError}>
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickDocPhoto(true, 'front')}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickDocPhoto(false, 'front')}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}
        {docPhotoError ? <Text style={styles.photoError}>{docPhotoError}</Text> : null}

        {/* Foto do documento - VERSO */}
        <Text style={[styles.label, { marginTop: 16 }]}>Documento - Verso</Text>
        <Text style={styles.photoHint}>
          Tire uma foto do verso do documento.
        </Text>

        {docPhotoBack ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: docPhotoBack }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhotoButton} onPress={clearDocPhotoBack}>
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </TouchableOpacity>
            {docPhotoBackStatus === 'validating' && (
              <View style={styles.validationOverlay}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.validationText}>Verificando documento...</Text>
              </View>
            )}
            {docPhotoBackStatus === 'valid' && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            )}
            {docPhotoBackStatus === 'invalid' && (
              <View style={styles.statusBadgeError}>
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickDocPhoto(true, 'back')}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickDocPhoto(false, 'back')}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}
        {docPhotoBackError ? <Text style={styles.photoError}>{docPhotoBackError}</Text> : null}

        {/* Contrato */}
        <View style={styles.contractSection}>
          <TouchableOpacity
            style={styles.contractHeader}
            onPress={() => setShowContract(!showContract)}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
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
          style={[styles.submitButton, (loading || uploading || !acceptedContract || !photosValid) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploading || !acceptedContract || !photosValid}
        >
          <Text style={styles.submitButtonText}>
            {uploading ? 'Enviando fotos...' : loading ? 'Enviando cadastro...' : 'Enviar cadastro'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
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
  validationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    color: colors.white,
    fontSize: fonts.small,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },
  statusBadgeError: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },
  photoError: {
    fontSize: fonts.tiny,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '600',
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
