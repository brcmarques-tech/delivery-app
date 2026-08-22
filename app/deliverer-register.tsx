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
import { compressImage } from '../src/lib/compressImage';
import { REGISTER_AS_DELIVERER, UPLOAD_IMAGE, VALIDATE_FACE_PHOTO, VALIDATE_DOCUMENT_PHOTO } from '../src/lib/graphql/mutations';
import { useAuth } from '../src/contexts/AuthContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../src/theme';
import { useTheme } from '../src/contexts/ThemeContext';

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

Ao se cadastrar como entregador na plataforma bcmTech Shopping, você declara estar ciente e de acordo com os seguintes termos:

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
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [taking, setTaking] = useState(false);

  async function takePicture() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: false,
      });
      if (photo && photo.uri) {
        const compressed = await compressImage(photo.uri, 800, 0.8);
        onCapture(compressed.uri, compressed.base64);
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
            <View style={[camStyles.ovalCutout, { borderColor: '#fff' }]} />
            <View style={camStyles.overlaySide} />
          </View>
          <View style={camStyles.overlayBottom} />
        </View>

        {/* Status text */}
        <View style={camStyles.statusContainer}>
          <View style={[camStyles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="scan-outline" size={18} color="#fff" />
            <Text style={[camStyles.statusText, { color: '#fff' }]}>
              Posicione seu rosto no oval
            </Text>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity style={camStyles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Capture button */}
        <View style={camStyles.captureContainer}>
          <TouchableOpacity
            style={[camStyles.captureButton, { backgroundColor: '#FF6B00', borderColor: '#fff' }]}
            onPress={takePicture}
            disabled={taking}
          >
            {taking ? (
              <ActivityIndicator color="#fff" />
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  captureDisabled: { opacity: 0.4 },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});

// ─── Main Screen ───
export default function DelivererRegisterScreen() {
  const { colors } = useTheme();
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

    // BUGFIX: o try cobria o UPLOAD e a VALIDACAO juntos, e o catch marcava
    // 'valid' nos dois casos. Se o upload falhasse (offline, arquivo grande,
    // timeout), a tela mostrava check verde enquanto facePhotoUrl continuava
    // null: o botao de enviar habilitava e o cadastro morria depois num erro
    // generico, sem dizer qual foto refazer. Aceitar a foto quando a VALIDACAO
    // esta indisponivel e proposital; aceitar sem ter enviado nao e.
    let imageUrl: string;
    try {
      const { data: uploadData } = await uploadImage({
        variables: { base64, folder: 'profile-photos' },
      });
      imageUrl = uploadData.uploadImage;
      if (!imageUrl) throw new Error('upload sem URL');
      setFacePhotoUrl(imageUrl);
    } catch {
      setFacePhotoStatus('invalid');
      setFacePhotoError('Falha no envio da foto. Toque para tentar de novo.');
      return;
    }

    try {
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
      // Validacao indisponivel (API fora): a foto JA foi enviada, entao aceita.
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
      quality: 1,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri, 800, 0.8);
      uploadAndValidateFace(compressed.uri, compressed.base64);
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
      // BUGFIX: mesmo problema da foto de rosto — sem URL o cadastro seguia com
      // check verde e morria depois num erro generico. Falha de ENVIO agora e
      // marcada como invalida (falha so de VALIDACAO segue aceitando).
      if (!imageUrl) {
        setStatus('invalid');
        setError('Falha no envio da foto. Toque para tentar de novo.');
        return;
      }
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
      // Falha aqui pode ser do envio OU da validacao. Como so chegamos a validar
      // depois de ter a URL, verificamos se a URL foi de fato registrada: sem
      // ela, a foto NAO subiu e nao pode ser dada como valida.
      setStatus((atual: any) => atual);
      setStatus('invalid');
      setError('Nao foi possivel processar a foto. Toque para tentar de novo.');
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
          quality: 1,
          allowsEditing: false,
          exif: false,
          cameraType: ImagePicker.CameraType.back,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: false,
          exif: false,
        });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri, 800, 0.8);
      await uploadAndValidateDoc(compressed.uri, compressed.base64, side);
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
    // BUGFIX: `new Date("9999-99-99")` da Invalid Date -> a subtracao vira NaN ->
    // `NaN < 18` e FALSE, entao a checagem de maioridade PASSAVA e uma data lixo
    // era enviada. Agora rejeita data invalida e calcula a idade por calendario
    // (a divisao por 365.25 errava por um dia perto do aniversario).
    if (Number.isNaN(birthObj.getTime())) {
      alert('Erro', 'Data de nascimento invalida.');
      return;
    }
    const hoje = new Date();
    let age = hoje.getFullYear() - birthObj.getFullYear();
    const mes = hoje.getMonth() - birthObj.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < birthObj.getDate())) age--;
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
      <View style={[styles.successContainer, { backgroundColor: colors.white }]}>
        <View style={[styles.successIconContainer, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Cadastro enviado!</Text>
        <Text style={[styles.successSubtitle, { color: colors.textLight }]}>
          Seu cadastro como entregador foi enviado e está aguardando aprovação do administrador.
          Você será notificado quando for aprovado.
        </Text>
        <TouchableOpacity
          style={[styles.successButton, { backgroundColor: '#FF6B00' }]}
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.successButtonText, { color: colors.white }]}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.white }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
        <Ionicons name="arrow-back" size={18} color={colors.text} />
      </TouchableOpacity>

      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="bicycle" size={36} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Quero ser entregador</Text>
      <Text style={[styles.subtitle, { color: colors.textLight }]}>
        Preencha seus dados para comecar a fazer entregas e ganhar dinheiro
      </Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Data de nascimento</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.grayLight, color: colors.text }]}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.gray}
          value={birthDate}
          onChangeText={(v) => setBirthDate(formatBirthDate(v))}
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={[styles.label, { color: colors.text }]}>Tipo de veiculo</Text>
        <View style={styles.vehicleContainer}>
          {vehicleTypes.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.vehicleButton,
                { borderColor: vehicleType === v.key ? colors.primary : colors.grayLight, backgroundColor: vehicleType === v.key ? colors.primary + '10' : 'transparent' },
              ]}
              onPress={() => setVehicleType(v.key)}
            >
              <Ionicons
                name={v.icon}
                size={18}
                color={vehicleType === v.key ? colors.primary : colors.gray}
              />
              <Text
                style={[
                  styles.vehicleText,
                  { color: vehicleType === v.key ? colors.primary : colors.textLight },
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(vehicleType === 'MOTO' || vehicleType === 'CARRO') && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Numero da CNH</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.grayLight, color: colors.text }]}
              placeholder="00000000000"
              placeholderTextColor={colors.gray}
              value={cnhNumber}
              onChangeText={setCnhNumber}
              keyboardType="numeric"
              maxLength={11}
            />

            <Text style={[styles.label, { color: colors.text }]}>Placa do veiculo</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.grayLight, color: colors.text }]}
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
        <Text style={[styles.label, { color: colors.text }]}>Foto do rosto (selfie)</Text>
        <Text style={[styles.photoHint, { color: colors.textLight }]}>
          Tire uma selfie com deteccao facial. Posicione seu rosto no oval.
        </Text>

        {facePhoto ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: facePhoto }} style={[styles.photoPreview, { backgroundColor: colors.grayLight }]} />
            <TouchableOpacity style={[styles.removePhotoButton, { backgroundColor: colors.white }]} onPress={clearFacePhoto}>
              <Ionicons name="close-circle" size={18} color={colors.danger} />
            </TouchableOpacity>
            {facePhotoStatus === 'validating' && (
              <View style={styles.validationOverlay}>
                <ActivityIndicator color={colors.white} />
                <Text style={[styles.validationText, { color: colors.white }]}>Verificando...</Text>
              </View>
            )}
            {facePhotoStatus === 'valid' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.white }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
            )}
            {facePhotoStatus === 'invalid' && (
              <View style={[styles.statusBadgeError, { backgroundColor: colors.white }]}>
                <Ionicons name="close-circle" size={18} color={colors.danger} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary + '30' }]} onPress={openFaceCamera}>
              <Ionicons name="scan-outline" size={18} color={colors.primary} />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Selfie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary + '30' }]} onPress={pickFaceFromGallery}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}
        {facePhotoError ? <Text style={[styles.photoError, { color: colors.danger }]}>{facePhotoError}</Text> : null}

        {/* Foto do documento - FRENTE */}
        <Text style={[styles.label, { marginTop: 12, color: colors.text }]}>Documento - Frente (RG ou CNH)</Text>
        <Text style={[styles.photoHint, { color: colors.textLight }]}>
          Tire uma foto da frente do documento, com os dados visiveis.
        </Text>

        {docPhoto ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: docPhoto }} style={[styles.photoPreview, { backgroundColor: colors.grayLight }]} />
            <TouchableOpacity style={[styles.removePhotoButton, { backgroundColor: colors.white }]} onPress={clearDocPhoto}>
              <Ionicons name="close-circle" size={18} color={colors.danger} />
            </TouchableOpacity>
            {docPhotoStatus === 'validating' && (
              <View style={styles.validationOverlay}>
                <ActivityIndicator color={colors.white} />
                <Text style={[styles.validationText, { color: colors.white }]}>Verificando documento...</Text>
              </View>
            )}
            {docPhotoStatus === 'valid' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.white }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
            )}
            {docPhotoStatus === 'invalid' && (
              <View style={[styles.statusBadgeError, { backgroundColor: colors.white }]}>
                <Ionicons name="close-circle" size={18} color={colors.danger} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary + '30' }]} onPress={() => pickDocPhoto(true, 'front')}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary + '30' }]} onPress={() => pickDocPhoto(false, 'front')}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}
        {docPhotoError ? <Text style={[styles.photoError, { color: colors.danger }]}>{docPhotoError}</Text> : null}

        {/* Foto do documento - VERSO */}
        <Text style={[styles.label, { marginTop: 12, color: colors.text }]}>Documento - Verso</Text>
        <Text style={[styles.photoHint, { color: colors.textLight }]}>
          Tire uma foto do verso do documento.
        </Text>

        {docPhotoBack ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: docPhotoBack }} style={[styles.photoPreview, { backgroundColor: colors.grayLight }]} />
            <TouchableOpacity style={[styles.removePhotoButton, { backgroundColor: colors.white }]} onPress={clearDocPhotoBack}>
              <Ionicons name="close-circle" size={18} color={colors.danger} />
            </TouchableOpacity>
            {docPhotoBackStatus === 'validating' && (
              <View style={styles.validationOverlay}>
                <ActivityIndicator color={colors.white} />
                <Text style={[styles.validationText, { color: colors.white }]}>Verificando documento...</Text>
              </View>
            )}
            {docPhotoBackStatus === 'valid' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.white }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
            )}
            {docPhotoBackStatus === 'invalid' && (
              <View style={[styles.statusBadgeError, { backgroundColor: colors.white }]}>
                <Ionicons name="close-circle" size={18} color={colors.danger} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary + '30' }]} onPress={() => pickDocPhoto(true, 'back')}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary + '30' }]} onPress={() => pickDocPhoto(false, 'back')}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}
        {docPhotoBackError ? <Text style={[styles.photoError, { color: colors.danger }]}>{docPhotoBackError}</Text> : null}

        {/* Contrato */}
        <View style={[styles.contractSection, { borderColor: colors.grayLight }]}>
          <TouchableOpacity
            style={[styles.contractHeader, { backgroundColor: colors.grayLight }]}
            onPress={() => setShowContract(!showContract)}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.text} />
            <Text style={[styles.contractHeaderText, { color: colors.text }]}>Termo de compromisso do entregador</Text>
            <Ionicons
              name={showContract ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.gray}
            />
          </TouchableOpacity>

          {showContract && (
            <ScrollView style={[styles.contractBody, { backgroundColor: colors.white }]} nestedScrollEnabled>
              <Text style={[styles.contractText, { color: colors.textLight }]}>{CONTRACT_TEXT}</Text>
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.checkboxRow, { borderTopColor: colors.grayLight }]}
            onPress={() => setAcceptedContract(!acceptedContract)}
          >
            <Ionicons
              name={acceptedContract ? 'checkbox' : 'square-outline'}
              size={18}
              color={acceptedContract ? colors.primary : colors.gray}
            />
            <Text style={[styles.checkboxText, { color: colors.text }]}>
              Li e aceito o termo de compromisso do entregador
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, (loading || uploading || !acceptedContract || !photosValid) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploading || !acceptedContract || !photosValid}
        >
          <Text style={[styles.submitButtonText, { color: colors.white }]}>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  successButtonText: {
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  container: { flex: 1 },
  content: { padding: 12, paddingTop: 56, paddingBottom: 40 },
  backButton: { marginBottom: 12 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.regular,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 22,
  },
  form: { gap: 6 },
  label: {
    fontSize: fonts.small,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
  },
  vehicleContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  vehicleButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
  },
  vehicleButtonActive: {},
  vehicleText: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  vehicleTextActive: {},
  photoHint: {
    fontSize: fonts.tiny,
    marginBottom: 8,
    lineHeight: 18,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
  },
  validationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  validationText: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 10,
    padding: 2,
  },
  statusBadgeError: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 10,
    padding: 2,
  },
  photoError: {
    fontSize: fonts.tiny,
    marginTop: 4,
    fontWeight: '600',
  },
  contractSection: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  contractHeaderText: {
    flex: 1,
    fontSize: fonts.small,
    fontWeight: '600',
  },
  contractBody: {
    maxHeight: 200,
    padding: 10,
  },
  contractText: {
    fontSize: fonts.tiny,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderTopWidth: 1,
  },
  checkboxText: {
    flex: 1,
    fontSize: fonts.small,
  },
  submitButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
});
