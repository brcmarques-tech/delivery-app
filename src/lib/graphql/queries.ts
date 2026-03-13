import { gql } from '@apollo/client';

export const GET_STORES = gql`
  query Stores {
    stores {
      id
      name
      description
      logoUrl
      bannerUrl
      isOpen
      deliveryFee
      estimatedDeliveryMinutes
      minimumOrder
    }
  }
`;

export const GET_NEARBY_STORES = gql`
  query NearbyStores($latitude: Float!, $longitude: Float!, $radiusKm: Float) {
    nearbyStores(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
      id
      name
      description
      logoUrl
      bannerUrl
      isOpen
      deliveryFee
      estimatedDeliveryMinutes
      minimumOrder
    }
  }
`;

export const GET_STORE = gql`
  query Store($id: String!) {
    store(id: $id) {
      id
      name
      description
      logoUrl
      bannerUrl
      isOpen
      hasOwnDelivery
      ownerMpConnected
      freeDelivery
      freeDeliveryAbove
      deliveryFee
      estimatedDeliveryMinutes
      minimumOrder
      products {
        id
        name
        description
        price
        promotionalPrice
        imageUrl
        isAvailable
        isVariableWeight
        unit
        category {
          id
          name
        }
      }
      categories {
        id
        name
      }
    }
  }
`;

export const GET_MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      orderNumber
      status
      total
      createdAt
      store {
        id
        name
        logoUrl
      }
      items {
        id
        quantity
        weightGrams
        totalPrice
        product {
          name
        }
      }
    }
  }
`;

export const GET_ORDER = gql`
  query Order($id: String!) {
    order(id: $id) {
      id
      orderNumber
      status
      subtotal
      deliveryFee
      total
      paymentMethod
      checkoutUrl
      pixQrCode
      pixQrCodeBase64
      notes
      deliveryAddress
      customerConfirmedAt
      createdAt
      store {
        name
        phone
      }
      items {
        id
        quantity
        weightGrams
        unitPrice
        totalPrice
        product {
          name
          imageUrl
        }
      }
      delivery {
        id
        currentLatitude
        currentLongitude
        deliveredAt
        deliverer {
          name
          phone
        }
      }
    }
  }
`;

export const GET_ACTIVE_PROMOTIONS = gql`
  query ActivePromotions {
    activePromotions {
      id
      title
      description
      imageUrl
      promotionalPrice
      product {
        id
        name
        imageUrl
        price
      }
      store {
        id
        name
      }
    }
  }
`;

export const CALCULATE_DELIVERY_FEE = gql`
  query CalculateDeliveryFee($storeId: String!, $customerLatitude: Float!, $customerLongitude: Float!) {
    calculateDeliveryFee(storeId: $storeId, customerLatitude: $customerLatitude, customerLongitude: $customerLongitude)
  }
`;

export const ESTIMATE_DELIVERY_TIME = gql`
  query EstimateDeliveryTime($storeId: String!, $customerLatitude: Float!, $customerLongitude: Float!) {
    estimatedDeliveryTime(storeId: $storeId, customerLatitude: $customerLatitude, customerLongitude: $customerLongitude)
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      cpf
      role
      isDeliverer
      pendingRole
      rejectedAt
      rejectionReason
      mpConnected
      acceptedTermsAt
    }
  }
`;

export const GET_CONTRACT_CONTENT = gql`
  query ContractContent($type: String!) {
    contractContent(type: $type)
  }
`;

export const GET_MP_CONNECT_URL = gql`
  query MpConnectUrl {
    mpConnectUrl(source: "app")
  }
`;

export const GET_MY_ADDRESSES = gql`
  query MyAddresses {
    myAddresses {
      id
      street
      number
      complement
      neighborhood
      city
      state
      zipCode
      latitude
      longitude
      isDefault
    }
  }
`;

export const GET_AVAILABLE_DELIVERIES = gql`
  query AvailableDeliveries {
    availableDeliveries {
      id
      orderNumber
      status
      total
      deliveryFee
      deliveryAddress
      createdAt
      store {
        id
        name
        street
        number
        neighborhood
        city
      }
      customer {
        name
        phone
      }
      items {
        id
        quantity
        product {
          name
        }
      }
    }
  }
`;

export const GET_MY_DELIVERIES = gql`
  query MyDeliveries {
    myDeliveries {
      id
      pickedUpAt
      deliveredAt
      createdAt
      order {
        id
        orderNumber
        status
        total
        deliveryFee
        deliveryAddress
        notes
        deliveryLatitude
        deliveryLongitude
        store {
          name
          street
          number
          neighborhood
          city
          phone
          latitude
          longitude
        }
        customer {
          name
          phone
        }
        items {
          id
          quantity
          product {
            name
          }
        }
      }
    }
  }
`;
