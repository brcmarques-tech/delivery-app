import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation RegisterApp($input: RegisterAppInput!) {
    registerApp(input: $input) {
      accessToken
      user {
        id
        name
        email
        cpf
        role
        isDeliverer
        pendingRole
        rejectedAt
        rejectionReason
        acceptedTermsAt
        emailVerified
        phoneVerified
      }
    }
  }
`;

export const VALIDATE_REGISTRATION = gql`
  mutation ValidateRegistration($email: String!, $cpf: String!, $phone: String!, $userType: String) {
    validateRegistration(email: $email, cpf: $cpf, phone: $phone, userType: $userType) {
      valid
      emailError
      cpfError
      phoneError
    }
  }
`;

export const SEND_VERIFICATION_CODE = gql`
  mutation SendVerificationCode($input: SendCodeInput!) {
    sendVerificationCode(input: $input)
  }
`;

export const VERIFY_CODE = gql`
  mutation VerifyCode($input: VerifyCodeInput!) {
    verifyCode(input: $input)
  }
`;

export const SEND_EMAIL_VERIFICATION = gql`
  mutation SendEmailVerification($userType: String) {
    sendEmailVerification(userType: $userType)
  }
`;

export const CONFIRM_EMAIL_VERIFICATION = gql`
  mutation ConfirmEmailVerification($code: String!, $userType: String) {
    confirmEmailVerification(code: $code, userType: $userType)
  }
`;

export const LOGIN = gql`
  mutation LoginApp($input: LoginInput!) {
    loginApp(input: $input) {
      accessToken
      user {
        id
        name
        email
        cpf
        role
        isDeliverer
        pendingRole
        rejectedAt
        rejectionReason
        acceptedTermsAt
        emailVerified
        phoneVerified
      }
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      total
      paymentMethod
      checkoutUrl
      pixQrCode
      pixQrCodeBase64
      createdAt
    }
  }
`;

export const REGISTER_AS_DELIVERER = gql`
  mutation RegisterAsDeliverer($input: RegisterDelivererInput!) {
    registerAsDeliverer(input: $input) {
      id
      name
      email
      role
      isDeliverer
      pendingRole
      vehicleType
      vehiclePlate
      identityPhotoUrl
      birthDate
      cnhNumber
      acceptedTermsAt
    }
  }
`;

export const ACCEPT_DELIVERY = gql`
  mutation AcceptDelivery($orderId: String!) {
    acceptDelivery(orderId: $orderId) {
      id
      order {
        id
        orderNumber
        status
      }
    }
  }
`;

export const CONFIRM_PICKUP = gql`
  mutation ConfirmPickup($deliveryId: String!) {
    confirmPickup(deliveryId: $deliveryId) {
      id
      pickedUpAt
      order {
        id
        status
      }
    }
  }
`;

export const UPLOAD_IMAGE = gql`
  mutation UploadImage($base64: String!, $folder: String) {
    uploadImage(base64: $base64, folder: $folder)
  }
`;

export const CONFIRM_DELIVERY = gql`
  mutation ConfirmDelivery($deliveryId: String!) {
    confirmDelivery(deliveryId: $deliveryId) {
      id
      deliveredAt
      order {
        id
        status
      }
    }
  }
`;

export const CREATE_ADDRESS = gql`
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id street number complement neighborhood city state zipCode
      latitude longitude isDefault
    }
  }
`;

export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($id: String!) {
    setDefaultAddress(id: $id) {
      id isDefault
    }
  }
`;

export const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: String!) {
    deleteAddress(id: $id)
  }
`;

export const DISCONNECT_MP = gql`
  mutation DisconnectMercadoPago {
    disconnectMercadoPago
  }
`;

export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterAppPushToken($token: String!) {
    registerAppPushToken(token: $token)
  }
`;

export const ACCEPT_TERMS = gql`
  mutation AcceptAppTerms {
    acceptAppTerms {
      id
      acceptedTermsAt
    }
  }
`;

export const CONFIRM_RECEIPT = gql`
  mutation ConfirmReceipt($orderId: String!) {
    confirmReceipt(orderId: $orderId) {
      id
      status
      customerConfirmedAt
    }
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordResetApp($email: String!) {
    requestPasswordResetApp(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword, type: "app")
  }
`;

export const GOOGLE_AUTH_APP = gql`
  mutation GoogleAuthApp($idToken: String!) {
    googleAuthApp(idToken: $idToken) {
      accessToken
      user {
        id name email cpf role isDeliverer pendingRole
        rejectedAt rejectionReason acceptedTermsAt
        emailVerified phoneVerified
      }
    }
  }
`;

export const REGISTER_APP_WITH_GOOGLE = gql`
  mutation RegisterAppWithGoogle($idToken: String!, $phone: String!, $cpf: String!) {
    registerAppWithGoogle(idToken: $idToken, phone: $phone, cpf: $cpf) {
      accessToken
      user {
        id name email cpf role isDeliverer pendingRole
        rejectedAt rejectionReason acceptedTermsAt
        emailVerified phoneVerified
      }
    }
  }
`;
