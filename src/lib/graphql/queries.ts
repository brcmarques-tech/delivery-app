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
      isOpen
      deliveryFee
      estimatedDeliveryMinutes
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
      notes
      deliveryAddress
      createdAt
      store {
        name
        phone
      }
      items {
        id
        quantity
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
        deliverer {
          name
          phone
        }
      }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      role
    }
  }
`;
