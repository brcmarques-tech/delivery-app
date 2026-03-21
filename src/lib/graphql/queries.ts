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
      latitude
      longitude
      hasOwnDelivery
      freeDelivery
      freeDeliveryAbove
      deliveryFee
      estimatedDeliveryMinutes
      deliveryStartTime
      deliveryEndTime
      minimumOrder
      verificationLevel
      verificationScore
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
      latitude
      longitude
      hasOwnDelivery
      freeDelivery
      freeDeliveryAbove
      deliveryFee
      estimatedDeliveryMinutes
      deliveryStartTime
      deliveryEndTime
      minimumOrder
      verificationLevel
      verificationScore
    }
  }
`;

export const GET_DELIVERY_PRICING = gql`
  query DeliveryPricing {
    deliveryBasePrice
    deliveryPricePerKm
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
      ownerPaymentConnected
      freeDelivery
      freeDeliveryAbove
      deliveryFee
      estimatedDeliveryMinutes
      minimumOrder
      verificationLevel
      verificationScore
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

export const GET_MY_CART = gql`
  query MyCart {
    myCart {
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
        isAvailable
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

export const GET_MY_CART_BY_STORE = gql`
  query MyCartByStore($storeId: String!) {
    myCartByStore(storeId: $storeId) {
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
        isAvailable
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

export const GET_MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      orderNumber
      status
      total
      customerConfirmedAt
      rejectionReason
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
      delivery {
        id
        deliveredAt
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
      vendorConfirmedPickupAt
      delivererConfirmedDeliveryAt
      completedAt
      disputedAt
      disputeReason
      estimatedDeliveryEta
      rejectedAt
      rejectionReason
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
      startDate
      endDate
      promotionalPrice
      product {
        id
        name
        imageUrl
        price
        description
      }
      store {
        id
        name
        logoUrl
        deliveryFee
        estimatedDeliveryMinutes
        freeDelivery
        isOpen
        verificationLevel
      }
    }
  }
`;

export const CALCULATE_DELIVERY_FEE = gql`
  query CalculateDeliveryFee($storeId: String!, $customerLatitude: Float!, $customerLongitude: Float!) {
    calculateDeliveryFee(storeId: $storeId, customerLatitude: $customerLatitude, customerLongitude: $customerLongitude)
  }
`;

export const GET_MINIMUM_ORDER_PLATFORM = gql`
  query MinimumOrderPlatform {
    minimumOrderPlatform
  }
`;

export const ESTIMATE_DELIVERY_TIME = gql`
  query EstimateDeliveryTime($storeId: String!, $customerLatitude: Float!, $customerLongitude: Float!) {
    estimatedDeliveryTime(storeId: $storeId, customerLatitude: $customerLatitude, customerLongitude: $customerLongitude)
  }
`;

export const GET_ME = gql`
  query MeApp {
    meApp {
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
      paymentConnected
      acceptedTermsAt
      emailVerified
      phoneVerified
      avatarUrl
    }
  }
`;

export const GET_CONTRACT_CONTENT = gql`
  query ContractContent($type: String!) {
    contractContent(type: $type)
  }
`;

export const LIST_MY_CARDS = gql`
  query MyCards {
    myCards {
      id
      lastFourDigits
      brand
      holderName
      expMonth
      expYear
    }
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

export const GET_POPULAR_PRODUCTS = gql`
  query PopularProducts($limit: Int) {
    popularProducts(limit: $limit) {
      id
      name
      description
      price
      promotionalPrice
      imageUrl
      isAvailable
      storeId
      storeName
      storeLogoUrl
      storeIsOpen
      categoryName
      totalSold
    }
  }
`;

export const GET_REORDER_SUGGESTIONS = gql`
  query ReorderSuggestions($limit: Int) {
    reorderSuggestions(limit: $limit) {
      id
      name
      description
      price
      promotionalPrice
      imageUrl
      isAvailable
      storeId
      storeName
      storeLogoUrl
      storeIsOpen
      lastOrderedAt
    }
  }
`;

export const GET_FREQUENT_STORES = gql`
  query FrequentStores($limit: Int) {
    frequentStores(limit: $limit) {
      id
      name
      description
      logoUrl
      bannerUrl
      isOpen
      freeDelivery
      deliveryFee
      verificationLevel
      orderCount
      lastOrderAt
    }
  }
`;

export const GET_TOP_STORES_WEEKLY = gql`
  query TopStoresWeekly($limit: Int) {
    topStoresWeekly(limit: $limit) {
      id
      name
      description
      logoUrl
      isOpen
      freeDelivery
      deliveryFee
      verificationLevel
      orderCount
      totalRevenue
    }
  }
`;

export const GET_FOLLOWED_STORES = gql`
  query FollowedStores {
    followedStores {
      id
      name
      description
      logoUrl
      bannerUrl
      isOpen
      freeDelivery
      deliveryFee
      verificationLevel
    }
  }
`;

export const IS_FOLLOWING_STORE = gql`
  query IsFollowingStore($storeId: String!) {
    isFollowingStore(storeId: $storeId)
  }
`;

export const GET_FOLLOWER_COUNT = gql`
  query FollowerCount($storeId: String!) {
    followerCount(storeId: $storeId)
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $limit: Int) {
    searchProducts(query: $query, limit: $limit) {
      id
      name
      description
      price
      promotionalPrice
      imageUrl
      isAvailable
      store {
        id
        name
        logoUrl
        isOpen
      }
      category {
        id
        name
      }
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
        delivererConfirmedDeliveryAt
        customerConfirmedAt
        completedAt
        disputedAt
        disputeReason
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

// ─── Recipient / Earnings ───

export const MY_BALANCE = gql`
  query MyBalance {
    myBalance {
      availableAmount
      waitingFundsAmount
      transferredAmount
    }
  }
`;

export const SIMULATE_ANTICIPATION = gql`
  query SimulateAnticipation {
    simulateAnticipation {
      originalAmount
      anticipatedAmount
      fee
      feePercentage
    }
  }
`;
