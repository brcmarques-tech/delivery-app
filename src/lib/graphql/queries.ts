import { gql } from '@apollo/client';

// Perf (F6): a vitrine de lojas era SEM argumento — baixava a tabela de lojas
// ativas inteira e a tela filtrava tudo no cliente (nome, tipo, aberto, frete
// gratis). Agora os filtros e a paginacao vao para o servidor. Todos os
// argumentos sao opcionais; sem nenhum, a resposta e a de antes.
export const GET_STORES = gql`
  query Stores(
    $limit: Int
    $offset: Int
    $search: String
    $storeType: String
    $onlyOpen: Boolean
    $onlyFreeDelivery: Boolean
  ) {
    stores(
      limit: $limit
      offset: $offset
      search: $search
      storeType: $storeType
      onlyOpen: $onlyOpen
      onlyFreeDelivery: $onlyFreeDelivery
    ) {
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
      storeType
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
      # KAN-13: a identidade visual escolhida pela loja. Nulo = tema do app.
      primaryColor
      backgroundColor
      textColor
      productLayout
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
      storeType
      services {
        id
        name
        description
        price
        estimatedDuration
        imageUrl
        isAvailable
        isActive
        requiresQuote
        category {
          id
          name
        }
      }
      categories {
        id
        name
        requiresAgeVerification
      }
    }
  }
`;

// Perf (F5/F6): catalogo paginado com busca server-side. Antes o GET_STORE
// descia TODOS os produtos da loja de uma vez (PREMIUM sem teto = milhares).
export const GET_STORE_PRODUCTS = gql`
  query StoreProducts($storeId: String!, $limit: Int, $offset: Int, $search: String, $categoryId: String) {
    storeProducts(storeId: $storeId, limit: $limit, offset: $offset, search: $search, categoryId: $categoryId) {
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
        requiresAgeVerification
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
  query MyOrders($limit: Int, $offset: Int) {
    myOrders(limit: $limit, offset: $offset) {
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
      cobrancaFeita
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
      # O FATO de usar código, nunca o valor. Decide se a tela mostra o cartão
      # do código ao cliente e se os botões antigos do entregador aparecem —
      # eles são recusados pelo servidor em pedido com código.
      usaCodigoDeEntrega
      codigoDaLojaJaRegistrado
      estimatedDeliveryEta
      rejectedAt
      rejectionReason
      createdAt
      store {
        id
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
          id
          name
          imageUrl
        }
      }
      deliveryLatitude
      deliveryLongitude
      delivery {
        id
        currentLatitude
        currentLongitude
        deliveredAt
        deliverer {
          name
          phone
          profilePhotoUrl
        }
      }
    }
  }
`;

export const GET_ACTIVE_PROMOTIONS = gql`
  query ActivePromotions($limit: Int, $offset: Int) {
    activePromotions(limit: $limit, offset: $offset) {
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
        storeType
      }
    }
  }
`;
// Perf (F6): UMA promocao por id. A tela de detalhe (promotion/[id].tsx) baixava
// a lista INTEIRA de promocoes ativas e fazia `.find(p => p.id === id)` no
// cliente. Alem do desperdicio, isso impedia paginar a lista: no momento em que
// activePromotions ganhasse limite, a tela pararia de achar promocao fora da
// primeira pagina. O servidor aplica o mesmo filtro da vitrine, entao o que era
// invisivel continua invisivel.
export const GET_PROMOTION = gql`
  query Promotion($id: String!) {
    promotion(id: $id) {
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

export const SEARCH_SERVICES = gql`
  query SearchServices($query: String!, $limit: Int) {
    searchServices(query: $query, limit: $limit) {
      id
      name
      description
      price
      estimatedDuration
      imageUrl
      isAvailable
      requiresQuote
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
      # Segundos que restam na SUA vez exclusiva (nulo = corrida aberta a todos).
      vezSegundosRestantes
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
  query MyDeliveries($limit: Int, $offset: Int) {
    myDeliveries(limit: $limit, offset: $offset) {
      id
      pickedUpAt
      deliveredAt
      createdAt
      order {
        id
        orderNumber
        status
        paymentMethod
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
        # Metadados dos códigos: o FATO, nunca o VALOR.
        #
        # usaCodigoDeEntrega decide se a tela mostra o fluxo de códigos ou os
        # botões antigos — pedido criado antes do deploy não tem código e só
        # fecha pelos antigos.
        #
        # codigoDaLojaJaRegistrado separa "preciso coletar" de "já coletei,
        # falta a loja confirmar o meu código". Sem ele os dois estados ficam
        # iguais na tela e o entregador não sabe o que fazer na porta da loja.
        #
        # (sem acento grave nestes comentários: ele fecharia o template literal
        # do gql e quebraria o arquivo — foi o que aconteceu na primeira versão)
        usaCodigoDeEntrega
        codigoDaLojaJaRegistrado
        store {
          id
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
          id
          name
          phone
        }
        items {
          id
          quantity
          product {
            id
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
      autoAnticipationEnabled
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
      # true = os valores NAO vieram do Pagar.me, sao estimativa nossa. A tela
      # tem de deixar isso visivel: antes o numero estimado era exibido com a
      # mesma cara de uma cotacao real.
      isEstimate
    }
  }
`;

// ─── Appointments ─────────────────────────────────────

export const AVAILABLE_SLOTS = gql`
  query AvailableSlots($storeId: String!, $serviceId: String!, $date: String!) {
    availableSlots(storeId: $storeId, serviceId: $serviceId, date: $date)
  }
`;

export const MY_APPOINTMENTS = gql`
  query MyAppointments($limit: Int, $offset: Int) {
    myAppointments(limit: $limit, offset: $offset) {
      id
      appointmentNumber
      scheduledDate
      scheduledTime
      endTime
      status
      price
      notes
      address
      quoteDescription
      quoteResponse
      paymentMethod
      createdAt
      customer {
        id
        name
      }
      store {
        id
        name
        logoUrl
      }
      service {
        id
        name
        description
        estimatedDuration
        imageUrl
      }
    }
  }
`;

export const GET_APPOINTMENT = gql`
  query Appointment($id: String!) {
    appointment(id: $id) {
      id
      appointmentNumber
      scheduledDate
      scheduledTime
      endTime
      status
      price
      notes
      address
      latitude
      longitude
      quoteDescription
      quoteResponse
      paymentMethod
      paymentStatus
      checkoutUrl
      pixQrCode
      pixQrCodeBase64
      createdAt
      customer {
        id
        name
        phone
      }
      store {
        id
        name
        logoUrl
      }
      service {
        id
        name
        description
        estimatedDuration
        imageUrl
        requiresQuote
      }
    }
  }
`;

export const STORE_SCHEDULE = gql`
  query StoreSchedule($storeId: String!) {
    storeSchedule(storeId: $storeId) {
      id
      dayOfWeek
      startTime
      endTime
      isActive
    }
  }
`;

export const RATING_FOR_APPOINTMENT = gql`
  query RatingForAppointment($appointmentId: String!) {
    ratingForAppointment(appointmentId: $appointmentId) {
      id
      rating
      comment
      photoUrls
      createdAt
    }
  }
`;

export const SERVICE_RATINGS = gql`
  query ServiceRatings($storeId: String!) {
    serviceRatings(storeId: $storeId) {
      id
      rating
      comment
      photoUrls
      createdAt
      customer {
        id
        name
      }
      service {
        id
        name
      }
    }
  }
`;

export const AVERAGE_STORE_RATING = gql`
  query AverageStoreRating($storeId: String!) {
    averageStoreRating(storeId: $storeId)
  }
`;

// ─── Códigos de entrega: cada parte lê SÓ o seu ──────────────────────────
//
// Três queries separadas, uma por parte, em vez de um campo no tipo Order.
// Isso não é preciosismo: se o código fosse campo do pedido, a consulta do
// ENTREGADOR traria o código do CLIENTE de carona — e é justamente esse o
// segredo que ele tem de receber da pessoa na porta. Cada query valida posse
// e devolve UM valor.
//
// Daí também os `fetchPolicy: 'network-only'` nas telas: código em cache é
// código que pode aparecer na tela errada depois de um logout.

/** O lojista lê o código DELE, para ditar ao entregador na coleta. */
export const GET_CODIGO_DA_MINHA_LOJA = gql`
  query CodigoDaMinhaLoja($orderId: String!) {
    codigoDaMinhaLoja(orderId: $orderId)
  }
`;

/** O entregador lê o código DELE, para o lojista digitar. */
export const GET_MEU_CODIGO_DE_ENTREGADOR = gql`
  query MeuCodigoDeEntregador($orderId: String!) {
    meuCodigoDeEntregador(orderId: $orderId)
  }
`;

/** O cliente lê o código DELE, para ditar ao entregador na entrega. */
export const GET_MEU_CODIGO_DE_ENTREGA = gql`
  query MeuCodigoDeEntrega($orderId: String!) {
    meuCodigoDeEntrega(orderId: $orderId)
  }
`;

// ─── Cliente fiel (KAN-12) ───
//
// Tudo do PROPRIO cliente: a query nao aceita id de usuario, de proposito.
export const MINHA_FIDELIDADE = gql`
  query MinhaFidelidade {
    minhaFidelidade {
      comprasNoTotal
      lojasOndeSouFiel
      descontoDisponivel
      porLoja {
        storeId
        storeName
        storeLogoUrl
        comprasConcluidas
        comprasNoMes
        faltamParaOProximoPremio
        proximoMarco
        clienteFiel
      }
      cupons {
        id
        code
        discountType
        discountValue
        maxUses
        usesCount
        isActive
        expiresAt
        origem
        store {
          id
          name
        }
      }
    }
  }
`;
