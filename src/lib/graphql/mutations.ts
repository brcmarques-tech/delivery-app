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
      identityPhotoBackUrl
      profilePhotoUrl
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

export const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($input: UpdateAddressInput!) {
    updateAddress(input: $input) {
      id street number complement neighborhood city state zipCode
      latitude longitude isDefault
    }
  }
`;

export const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: String!) {
    deleteAddress(id: $id)
  }
`;

export const DISCONNECT_PAYMENT = gql`
  mutation DisconnectPayment {
    disconnectPayment
  }
`;

export const SAVE_CARD = gql`
  mutation SaveCard($token: String!) {
    saveCard(token: $token) {
      id
      lastFourDigits
      brand
      holderName
      expMonth
      expYear
    }
  }
`;

export const DELETE_CARD = gql`
  mutation DeleteCard($cardId: String!) {
    deleteCard(cardId: $cardId)
  }
`;

export const UPDATE_APP_PROFILE = gql`
  mutation UpdateAppProfile($name: String, $phone: String, $avatarUrl: String) {
    updateAppProfile(name: $name, phone: $phone, avatarUrl: $avatarUrl) {
      id name phone avatarUrl
    }
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

// Cart
export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      id
      quantity
      notes
      weightGrams
      product {
        id
        name
        price
        promotionalPrice
        imageUrl
        isVariableWeight
        unit
      }
      store {
        id
        name
      }
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      id
      quantity
      notes
      weightGrams
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartItemId: String!) {
    removeFromCart(cartItemId: $cartItemId)
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;

export const CLEAR_CART_BY_STORE = gql`
  mutation ClearCartByStore($storeId: String!) {
    clearCartByStore(storeId: $storeId)
  }
`;

export const VALIDATE_FACE_PHOTO = gql`
  mutation ValidateFacePhoto($imageUrl: String!) {
    validateFacePhoto(imageUrl: $imageUrl) {
      valid
      message
    }
  }
`;

export const VALIDATE_DOCUMENT_PHOTO = gql`
  mutation ValidateDocumentPhoto($imageUrl: String!) {
    validateDocumentPhoto(imageUrl: $imageUrl) {
      valid
      message
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
