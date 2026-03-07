import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        name
        email
        role
        isDeliverer
        pendingRole
        rejectedAt
        rejectionReason
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
        role
        isDeliverer
        pendingRole
        rejectedAt
        rejectionReason
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
      cpf
      vehicleType
      vehiclePlate
      identityPhotoUrl
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
