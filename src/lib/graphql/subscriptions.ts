import { gql } from '@apollo/client';

export const ORDER_UPDATED = gql`
  subscription OrderUpdated($storeId: String, $orderId: String) {
    orderUpdated(storeId: $storeId, orderId: $orderId) {
      id
      orderNumber
      status
      total
      subtotal
      deliveryFee
      deliveryAddress
      notes
      paymentMethod
      isPickup
      customerConfirmedAt
      createdAt
      store {
        id
        name
        imageUrl
      }
      items {
        id
        quantity
        unitPrice
        totalPrice
        product {
          id
          name
          imageUrl
        }
      }
      delivery {
        id
        currentLatitude
        currentLongitude
        pickedUpAt
        deliveredAt
        deliverer {
          id
          name
        }
      }
    }
  }
`;

export const ORDER_CREATED = gql`
  subscription OrderCreated($storeId: String) {
    orderCreated(storeId: $storeId) {
      id
      orderNumber
      status
      total
      createdAt
      store {
        id
        name
      }
    }
  }
`;

export const STORE_UPDATED = gql`
  subscription StoreUpdated($storeId: String) {
    storeUpdated(storeId: $storeId) {
      id
      name
      isOpen
      isActive
      imageUrl
    }
  }
`;

export const PRODUCT_UPDATED = gql`
  subscription ProductUpdated($storeId: String) {
    productUpdated(storeId: $storeId) {
      id
      name
      price
      promotionalPrice
      imageUrl
      isAvailable
      stock
      unit
    }
  }
`;

export const PRODUCT_DELETED = gql`
  subscription ProductDeleted($storeId: String) {
    productDeleted(storeId: $storeId) {
      id
      storeId
    }
  }
`;

export const PROMOTION_UPDATED = gql`
  subscription PromotionUpdated {
    promotionUpdated {
      id
      title
      description
      imageUrl
      promotionalPrice
      isActive
      isPaid
      startDate
      endDate
      store {
        id
        name
      }
      product {
        id
        name
        imageUrl
      }
    }
  }
`;

export const DELIVERY_UPDATED = gql`
  subscription DeliveryUpdated($orderId: String) {
    deliveryUpdated(orderId: $orderId) {
      id
      currentLatitude
      currentLongitude
      pickedUpAt
      deliveredAt
      order {
        id
        status
      }
      deliverer {
        id
        name
      }
    }
  }
`;

export const SESSION_KICKED = gql`
  subscription SessionKicked($userId: String!, $userType: String) {
    sessionKicked(userId: $userId, userType: $userType) {
      userId
      userType
    }
  }
`;
