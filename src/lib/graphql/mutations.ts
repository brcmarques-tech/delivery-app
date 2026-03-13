import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
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
  mutation RegisterPushToken($token: String!) {
    registerPushToken(token: $token)
  }
`;

export const ACCEPT_TERMS = gql`
  mutation AcceptTerms {
    acceptTerms {
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
