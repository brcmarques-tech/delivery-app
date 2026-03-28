import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type AddToCartInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
  quantity?: Scalars['Int']['input'];
  weightGrams?: InputMaybe<Scalars['Int']['input']>;
};

export type Address = {
  __typename?: 'Address';
  city: Scalars['String']['output'];
  complement?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isDefault: Scalars['Boolean']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  neighborhood: Scalars['String']['output'];
  number: Scalars['String']['output'];
  state: Scalars['String']['output'];
  street: Scalars['String']['output'];
  user: AppUser;
  zipCode: Scalars['String']['output'];
};

export type AnticipationResult = {
  __typename?: 'AnticipationResult';
  approvedAmount: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  fee: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  requestedAmount: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type AnticipationSimulation = {
  __typename?: 'AnticipationSimulation';
  anticipatedAmount: Scalars['Float']['output'];
  fee: Scalars['Float']['output'];
  feePercentage: Scalars['Float']['output'];
  originalAmount: Scalars['Float']['output'];
};

export type AppAuthResponse = {
  __typename?: 'AppAuthResponse';
  accessToken: Scalars['String']['output'];
  user: AppUser;
};

export type AppUser = {
  __typename?: 'AppUser';
  acceptedTermsAt?: Maybe<Scalars['DateTime']['output']>;
  addresses?: Maybe<Array<Address>>;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  birthDate?: Maybe<Scalars['String']['output']>;
  cnhNumber?: Maybe<Scalars['String']['output']>;
  cpf?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  googleId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  identityPhotoBackUrl?: Maybe<Scalars['String']['output']>;
  identityPhotoUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isDeliverer: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  notificationEmail?: Maybe<Scalars['String']['output']>;
  orders?: Maybe<Array<Order>>;
  pagarmeRecipientId?: Maybe<Scalars['String']['output']>;
  paymentConnected: Scalars['Boolean']['output'];
  pendingRole?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
  phoneVerified: Scalars['Boolean']['output'];
  profilePhotoUrl?: Maybe<Scalars['String']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  updatedAt: Scalars['DateTime']['output'];
  vehiclePlate?: Maybe<Scalars['String']['output']>;
  vehicleType?: Maybe<Scalars['String']['output']>;
};

export type Appointment = {
  __typename?: 'Appointment';
  address?: Maybe<Scalars['String']['output']>;
  appointmentNumber: Scalars['String']['output'];
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  commissionAmount?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  endTime: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  pagarmeOrderId?: Maybe<Scalars['String']['output']>;
  paymentMethod?: Maybe<Scalars['String']['output']>;
  paymentStatus?: Maybe<Scalars['String']['output']>;
  pixQrCode?: Maybe<Scalars['String']['output']>;
  pixQrCodeBase64?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  quoteDescription?: Maybe<Scalars['String']['output']>;
  quoteResponse?: Maybe<Scalars['String']['output']>;
  scheduledDate: Scalars['String']['output'];
  scheduledTime: Scalars['String']['output'];
  service: Service;
  status: AppointmentStatus;
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AppointmentStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  NoShow = 'NO_SHOW',
  Pending = 'PENDING',
  Quoted = 'QUOTED',
  QuoteAccepted = 'QUOTE_ACCEPTED',
  QuoteRejected = 'QUOTE_REJECTED',
  QuoteRequested = 'QUOTE_REQUESTED'
}

export type ApprovalLog = {
  __typename?: 'ApprovalLog';
  action: Scalars['String']['output'];
  adminId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  identityPhotoBackUrl?: Maybe<Scalars['String']['output']>;
  identityPhotoUrl?: Maybe<Scalars['String']['output']>;
  profilePhotoUrl?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  userName: Scalars['String']['output'];
  userType: Scalars['String']['output'];
};

export type BarcodeLookupResult = {
  __typename?: 'BarcodeLookupResult';
  barcode: Scalars['String']['output'];
  brand?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
};

export type BulkCreateProductsInput = {
  products: Array<BulkProductItem>;
  storeId: Scalars['String']['input'];
};

export type BulkImportResult = {
  __typename?: 'BulkImportResult';
  created: Scalars['Int']['output'];
  errors: Array<Scalars['String']['output']>;
};

export type BulkProductItem = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isVariableWeight?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  stock?: InputMaybe<Scalars['Float']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type CartItem = {
  __typename?: 'CartItem';
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  product: Product;
  quantity: Scalars['Int']['output'];
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
  weightGrams?: Maybe<Scalars['Int']['output']>;
};

export type CartProductSummary = {
  __typename?: 'CartProductSummary';
  productId: Scalars['ID']['output'];
  productImageUrl?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  totalPeople: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type Category = {
  __typename?: 'Category';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  products?: Maybe<Array<Product>>;
  requiresAgeVerification: Scalars['Boolean']['output'];
  sortOrder: Scalars['Float']['output'];
  store: Store;
};

export type Coupon = {
  __typename?: 'Coupon';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  discountType: Scalars['String']['output'];
  discountValue: Scalars['Float']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  maxDiscount?: Maybe<Scalars['Float']['output']>;
  maxUses: Scalars['Int']['output'];
  minimumOrder?: Maybe<Scalars['Float']['output']>;
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
  usesCount: Scalars['Int']['output'];
};

export type CouponValidation = {
  __typename?: 'CouponValidation';
  couponId: Scalars['String']['output'];
  discount: Scalars['Float']['output'];
  message: Scalars['String']['output'];
  valid: Scalars['Boolean']['output'];
};

export type CreateAddressInput = {
  city: Scalars['String']['input'];
  complement?: InputMaybe<Scalars['String']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  neighborhood: Scalars['String']['input'];
  number: Scalars['String']['input'];
  state: Scalars['String']['input'];
  street: Scalars['String']['input'];
  zipCode: Scalars['String']['input'];
};

export type CreateAppointmentInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  cardId?: InputMaybe<Scalars['String']['input']>;
  cardToken?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  /** ON_SERVICE | PIX | CREDIT_CARD */
  paymentMethod?: InputMaybe<Scalars['String']['input']>;
  scheduledDate: Scalars['String']['input'];
  scheduledTime: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};

export type CreateCouponInput = {
  code: Scalars['String']['input'];
  discountType?: Scalars['String']['input'];
  discountValue: Scalars['Float']['input'];
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  maxDiscount?: InputMaybe<Scalars['Float']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
  storeId: Scalars['String']['input'];
};

export type CreateOrderInput = {
  ageVerified?: InputMaybe<Scalars['Boolean']['input']>;
  cardId?: InputMaybe<Scalars['String']['input']>;
  cardToken?: InputMaybe<Scalars['String']['input']>;
  couponCode?: InputMaybe<Scalars['String']['input']>;
  deliveryAddress?: InputMaybe<Scalars['String']['input']>;
  deliveryLatitude?: InputMaybe<Scalars['Float']['input']>;
  deliveryLongitude?: InputMaybe<Scalars['Float']['input']>;
  isPickup?: InputMaybe<Scalars['Boolean']['input']>;
  items: Array<OrderItemInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
  paymentMethod?: InputMaybe<Scalars['String']['input']>;
  storeId: Scalars['String']['input'];
};

export type CreateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isVariableWeight?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  stock?: InputMaybe<Scalars['Float']['input']>;
  storeId: Scalars['String']['input'];
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePromotionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['DateTime']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  productId?: InputMaybe<Scalars['String']['input']>;
  promotionalPrice: Scalars['Float']['input'];
  startDate: Scalars['DateTime']['input'];
  storeId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateServiceInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDuration?: InputMaybe<Scalars['Int']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  price?: InputMaybe<Scalars['Float']['input']>;
  requiresQuote?: InputMaybe<Scalars['Boolean']['input']>;
  storeId: Scalars['String']['input'];
};

export type CreateServiceRatingInput = {
  appointmentId: Scalars['String']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  photoUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  rating: Scalars['Int']['input'];
};

export type CreateStoreInput = {
  bannerUrl?: InputMaybe<Scalars['String']['input']>;
  city: Scalars['String']['input'];
  complement?: InputMaybe<Scalars['String']['input']>;
  deliveryEndTime?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  deliveryStartTime?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDeliveryMinutes?: InputMaybe<Scalars['Float']['input']>;
  freeDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  freeDeliveryAbove?: InputMaybe<Scalars['Float']['input']>;
  hasOwnDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  neighborhood: Scalars['String']['input'];
  number: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  state: Scalars['String']['input'];
  storeType?: InputMaybe<StoreType>;
  street: Scalars['String']['input'];
  zipCode: Scalars['String']['input'];
};

export type DashboardStats = {
  __typename?: 'DashboardStats';
  activeDeliveries: Scalars['Int']['output'];
  appointmentRevenue: Scalars['Float']['output'];
  avgTicket: Scalars['Float']['output'];
  cancellationRate: Scalars['Float']['output'];
  completedDeliveries: Scalars['Int']['output'];
  onlineDeliverers: Scalars['Int']['output'];
  ordersByDay: Array<DayStats>;
  ordersByStatus: Array<StatusCount>;
  pendingApprovals: Scalars['Int']['output'];
  platformRevenue: Scalars['Float']['output'];
  recentOrders: Array<RecentOrder>;
  topStores: Array<TopStore>;
  totalAppointments: Scalars['Int']['output'];
  totalDeliveries: Scalars['Int']['output'];
  totalOrders: Scalars['Int']['output'];
  totalRevenue: Scalars['Float']['output'];
  totalStores: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
  usersByRole: Array<RoleCount>;
};

export type DayStats = {
  __typename?: 'DayStats';
  count: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
};

export type Delivery = {
  __typename?: 'Delivery';
  createdAt: Scalars['DateTime']['output'];
  currentLatitude?: Maybe<Scalars['Float']['output']>;
  currentLongitude?: Maybe<Scalars['Float']['output']>;
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  deliverer?: Maybe<AppUser>;
  id: Scalars['ID']['output'];
  order: Order;
  payoutAmount?: Maybe<Scalars['Float']['output']>;
  payoutMpId?: Maybe<Scalars['String']['output']>;
  payoutStatus?: Maybe<Scalars['String']['output']>;
  pickedUpAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  vendorPayoutAmount?: Maybe<Scalars['Float']['output']>;
  vendorPayoutMpId?: Maybe<Scalars['String']['output']>;
  vendorPayoutStatus?: Maybe<Scalars['String']['output']>;
};

export type FrequentStore = {
  __typename?: 'FrequentStore';
  bannerUrl?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  freeDelivery: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isOpen: Scalars['Boolean']['output'];
  lastOrderAt: Scalars['DateTime']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  orderCount: Scalars['Int']['output'];
  verificationLevel?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptAppTerms: AppUser;
  acceptDelivery: Delivery;
  acceptQuote: Appointment;
  acceptSubscriptionTerms: VendorUser;
  acceptVendorTerms: VendorUser;
  addToCart: CartItem;
  adjustOrderItemWeight: Order;
  adminDeleteCoupon: Scalars['Boolean']['output'];
  adminToggleCoupon: Coupon;
  approveAppUser: AppUser;
  approveVendorUser: VendorUser;
  bulkCreateProducts: BulkImportResult;
  cancelAppointment: Appointment;
  cancelDispute: Order;
  cancelOrder: Order;
  claimBadgeReward: Store;
  clearAllNotifications: Scalars['Boolean']['output'];
  clearCart: Scalars['Boolean']['output'];
  clearCartByStore: Scalars['Boolean']['output'];
  completeAppointment: Appointment;
  confirmAppointment: Appointment;
  confirmDelivery: Delivery;
  confirmEmailVerification: Scalars['Boolean']['output'];
  confirmPickup: Delivery;
  confirmReceipt: Order;
  createAddress: Address;
  createAppointment: Appointment;
  createCategory: Category;
  createCoupon: Coupon;
  createOrder: Order;
  createPlanUpgrade: Payment;
  createProduct: Product;
  createPromotion: Promotion;
  createService: Service;
  createStore: Store;
  customerDenyDelivery: Order;
  deleteAddress: Scalars['Boolean']['output'];
  deleteCard: Scalars['Boolean']['output'];
  deleteCategory: Scalars['Boolean']['output'];
  deleteCoupon: Scalars['Boolean']['output'];
  deleteNotification: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deletePromotion: Scalars['Boolean']['output'];
  deleteService: Scalars['Boolean']['output'];
  disconnectPayment: Scalars['Boolean']['output'];
  disputeCompletedOrder: Order;
  followStore: Scalars['Boolean']['output'];
  googleAuthApp: AppAuthResponse;
  googleAuthVendor: VendorAuthResponse;
  loginApp: AppAuthResponse;
  loginVendor: VendorAuthResponse;
  logout: Scalars['Boolean']['output'];
  markNoShow: Appointment;
  markPromotionPaid: Promotion;
  rateService: ServiceRating;
  recalculateVerification: Store;
  refundOrder: Order;
  registerApp: AppAuthResponse;
  registerAppPushToken: Scalars['Boolean']['output'];
  registerAppWithGoogle: AppAuthResponse;
  registerAsDeliverer: AppUser;
  registerRecipient: Scalars['Boolean']['output'];
  registerSuperadmin: AppUser;
  registerVendor: VendorAuthResponse;
  registerVendorPushToken: Scalars['Boolean']['output'];
  registerVendorWithGoogle: VendorAuthResponse;
  rejectAppUser: AppUser;
  rejectOrder: Order;
  rejectQuote: Appointment;
  rejectVendorUser: VendorUser;
  removeFromCart: Scalars['Boolean']['output'];
  requestAnticipation: AnticipationResult;
  requestCancelDispute: Order;
  requestPasswordResetApp: Scalars['String']['output'];
  requestPasswordResetVendor: Scalars['String']['output'];
  requestQuote: Appointment;
  requestStoreDelete: Scalars['Boolean']['output'];
  requestVendorStoreDelete: Scalars['Boolean']['output'];
  resendNotification: Scalars['Boolean']['output'];
  resetPassword: Scalars['Boolean']['output'];
  resolveDispute: Order;
  respondQuote: Appointment;
  restoreProduct: Product;
  saveCard: SavedCard;
  sendEmailVerification: Scalars['Boolean']['output'];
  sendVerificationCode: Scalars['String']['output'];
  setDefaultAddress: Address;
  setDeliveryBasePrice: PlatformConfig;
  setDeliveryCommissionPercent: PlatformConfig;
  setDeliveryPricePerKm: PlatformConfig;
  setMinimumOrderPlatform: PlatformConfig;
  setPromoPricePerDay: PlatformConfig;
  setSchedule: Array<Schedule>;
  setStoreVerification: Store;
  simulatePayment: Order;
  swapPromotionProduct: Promotion;
  toggleAppUserActive: AppUser;
  toggleAutoAnticipation: Scalars['Boolean']['output'];
  toggleCouponActive: Coupon;
  toggleProductActive: Product;
  toggleProductAvailability: Product;
  togglePromotionActive: Promotion;
  toggleStoreActive: Store;
  toggleStoreOpen: Store;
  toggleVendorUserActive: VendorUser;
  unfollowStore: Scalars['Boolean']['output'];
  updateAddress: Address;
  updateAppProfile: AppUser;
  updateAppUserRole: AppUser;
  updateBadgePoints: Scalars['Boolean']['output'];
  updateBadgeRewards: Scalars['Boolean']['output'];
  updateBadgeThresholds: Scalars['Boolean']['output'];
  updateCartItem: CartItem;
  updateCategory: Category;
  updateContractContent: Scalars['Boolean']['output'];
  updateCoupon: Coupon;
  updateNotificationEmail: AppUser;
  updateOrderStatus: Order;
  updatePlanConfig: Scalars['Boolean']['output'];
  updateProduct: Product;
  updateService: Service;
  updateStore: Store;
  updateSuperadminPermissions: AppUser;
  updateVendorPlan: VendorUser;
  updateVendorProfile: VendorUser;
  uploadFromUrl: Scalars['String']['output'];
  uploadImage: Scalars['String']['output'];
  validateDocumentPhoto: PhotoValidation;
  validateFacePhoto: PhotoValidation;
  validateRegistration: ValidationResult;
  vendorCancelAppointment: Appointment;
  vendorCancelOrder: Order;
  vendorConfirmPickup: Order;
  verifyCode: Scalars['Boolean']['output'];
};


export type MutationAcceptDeliveryArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationAcceptQuoteArgs = {
  id: Scalars['String']['input'];
  scheduledDate: Scalars['String']['input'];
  scheduledTime: Scalars['String']['input'];
};


export type MutationAddToCartArgs = {
  input: AddToCartInput;
};


export type MutationAdjustOrderItemWeightArgs = {
  actualWeightGrams: Scalars['Int']['input'];
  orderItemId: Scalars['String']['input'];
};


export type MutationAdminDeleteCouponArgs = {
  id: Scalars['String']['input'];
};


export type MutationAdminToggleCouponArgs = {
  id: Scalars['String']['input'];
};


export type MutationApproveAppUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationApproveVendorUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationBulkCreateProductsArgs = {
  input: BulkCreateProductsInput;
};


export type MutationCancelAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationCancelDisputeArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationCancelOrderArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationClaimBadgeRewardArgs = {
  level: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type MutationClearCartByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationCompleteAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationConfirmAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationConfirmDeliveryArgs = {
  deliveryId: Scalars['String']['input'];
};


export type MutationConfirmEmailVerificationArgs = {
  code: Scalars['String']['input'];
  userType?: Scalars['String']['input'];
};


export type MutationConfirmPickupArgs = {
  deliveryId: Scalars['String']['input'];
};


export type MutationConfirmReceiptArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationCreateAddressArgs = {
  input: CreateAddressInput;
};


export type MutationCreateAppointmentArgs = {
  input: CreateAppointmentInput;
};


export type MutationCreateCategoryArgs = {
  name: Scalars['String']['input'];
  requiresAgeVerification?: InputMaybe<Scalars['Boolean']['input']>;
  storeId: Scalars['String']['input'];
};


export type MutationCreateCouponArgs = {
  input: CreateCouponInput;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCreatePlanUpgradeArgs = {
  billingPeriod?: InputMaybe<Scalars['String']['input']>;
  plan: VendorPlan;
};


export type MutationCreateProductArgs = {
  input: CreateProductInput;
};


export type MutationCreatePromotionArgs = {
  input: CreatePromotionInput;
};


export type MutationCreateServiceArgs = {
  input: CreateServiceInput;
};


export type MutationCreateStoreArgs = {
  input: CreateStoreInput;
};


export type MutationCustomerDenyDeliveryArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationDeleteAddressArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteCardArgs = {
  cardId: Scalars['String']['input'];
};


export type MutationDeleteCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteCouponArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePromotionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteServiceArgs = {
  id: Scalars['String']['input'];
};


export type MutationDisputeCompletedOrderArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationFollowStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationGoogleAuthAppArgs = {
  idToken: Scalars['String']['input'];
};


export type MutationGoogleAuthVendorArgs = {
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
  idToken: Scalars['String']['input'];
};


export type MutationLoginAppArgs = {
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
  input: LoginInput;
};


export type MutationLoginVendorArgs = {
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
  input: LoginInput;
};


export type MutationMarkNoShowArgs = {
  id: Scalars['String']['input'];
};


export type MutationMarkPromotionPaidArgs = {
  id: Scalars['String']['input'];
};


export type MutationRateServiceArgs = {
  input: CreateServiceRatingInput;
};


export type MutationRecalculateVerificationArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationRefundOrderArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationRegisterAppArgs = {
  input: RegisterAppInput;
};


export type MutationRegisterAppPushTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationRegisterAppWithGoogleArgs = {
  cpf: Scalars['String']['input'];
  idToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};


export type MutationRegisterAsDelivererArgs = {
  input: RegisterDelivererInput;
};


export type MutationRegisterRecipientArgs = {
  recipientData: Scalars['String']['input'];
};


export type MutationRegisterSuperadminArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  permissions?: InputMaybe<Scalars['String']['input']>;
  phone: Scalars['String']['input'];
};


export type MutationRegisterVendorArgs = {
  input: RegisterVendorInput;
};


export type MutationRegisterVendorPushTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationRegisterVendorWithGoogleArgs = {
  cpf: Scalars['String']['input'];
  idToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};


export type MutationRejectAppUserArgs = {
  id: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRejectOrderArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRejectQuoteArgs = {
  id: Scalars['String']['input'];
};


export type MutationRejectVendorUserArgs = {
  id: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRemoveFromCartArgs = {
  cartItemId: Scalars['String']['input'];
};


export type MutationRequestCancelDisputeArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationRequestPasswordResetAppArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestPasswordResetVendorArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestQuoteArgs = {
  input: RequestQuoteInput;
};


export type MutationRequestStoreDeleteArgs = {
  password: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type MutationRequestVendorStoreDeleteArgs = {
  password: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type MutationResendNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
  type?: Scalars['String']['input'];
};


export type MutationResolveDisputeArgs = {
  orderId: Scalars['String']['input'];
  resolution: Scalars['String']['input'];
};


export type MutationRespondQuoteArgs = {
  id: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  response: Scalars['String']['input'];
};


export type MutationRestoreProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationSaveCardArgs = {
  token: Scalars['String']['input'];
};


export type MutationSendEmailVerificationArgs = {
  userType?: Scalars['String']['input'];
};


export type MutationSendVerificationCodeArgs = {
  input: SendCodeInput;
};


export type MutationSetDefaultAddressArgs = {
  id: Scalars['String']['input'];
};


export type MutationSetDeliveryBasePriceArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetDeliveryCommissionPercentArgs = {
  percent: Scalars['Float']['input'];
};


export type MutationSetDeliveryPricePerKmArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetMinimumOrderPlatformArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetPromoPricePerDayArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetScheduleArgs = {
  input: SetScheduleInput;
};


export type MutationSetStoreVerificationArgs = {
  level: VerificationLevel;
  score?: InputMaybe<Scalars['Float']['input']>;
  storeId: Scalars['String']['input'];
};


export type MutationSimulatePaymentArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationSwapPromotionProductArgs = {
  id: Scalars['String']['input'];
  productId: Scalars['String']['input'];
  promotionalPrice: Scalars['Float']['input'];
  title: Scalars['String']['input'];
};


export type MutationToggleAppUserActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleAutoAnticipationArgs = {
  enabled: Scalars['Boolean']['input'];
};


export type MutationToggleCouponActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleProductActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleProductAvailabilityArgs = {
  id: Scalars['String']['input'];
};


export type MutationTogglePromotionActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleStoreActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleStoreOpenArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleVendorUserActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationUnfollowStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationUpdateAddressArgs = {
  input: UpdateAddressInput;
};


export type MutationUpdateAppProfileArgs = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateAppUserRoleArgs = {
  id: Scalars['String']['input'];
  role: UserRole;
};


export type MutationUpdateBadgePointsArgs = {
  points: Scalars['String']['input'];
};


export type MutationUpdateBadgeRewardsArgs = {
  level: Scalars['String']['input'];
  rewards: Scalars['String']['input'];
};


export type MutationUpdateBadgeThresholdsArgs = {
  thresholds: Scalars['String']['input'];
};


export type MutationUpdateCartItemArgs = {
  input: UpdateCartItemInput;
};


export type MutationUpdateCategoryArgs = {
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  requiresAgeVerification?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateContractContentArgs = {
  content: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationUpdateCouponArgs = {
  input: UpdateCouponInput;
};


export type MutationUpdateNotificationEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationUpdateOrderStatusArgs = {
  id: Scalars['String']['input'];
  status: OrderStatus;
};


export type MutationUpdatePlanConfigArgs = {
  annualPrice: Scalars['Float']['input'];
  canUseCoupons: Scalars['Boolean']['input'];
  commissionPercent: Scalars['Float']['input'];
  freePromosPerWeek: Scalars['Int']['input'];
  hasAnalytics: Scalars['Boolean']['input'];
  highlightDaysPerMonth: Scalars['Int']['input'];
  isContactSales: Scalars['Boolean']['input'];
  listingPriority: Scalars['Int']['input'];
  maxEmailsPerMonth: Scalars['Int']['input'];
  maxProductsPerStore: Scalars['Int']['input'];
  maxStores: Scalars['Int']['input'];
  monthlyPrice: Scalars['Float']['input'];
  plan: VendorPlan;
  quarterlyPrice: Scalars['Float']['input'];
  semiannualPrice: Scalars['Float']['input'];
  supportLevel: Scalars['String']['input'];
};


export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
};


export type MutationUpdateServiceArgs = {
  input: UpdateServiceInput;
};


export type MutationUpdateStoreArgs = {
  input: UpdateStoreInput;
};


export type MutationUpdateSuperadminPermissionsArgs = {
  id: Scalars['String']['input'];
  permissions: Scalars['String']['input'];
};


export type MutationUpdateVendorPlanArgs = {
  durationMonths?: Scalars['Int']['input'];
  id: Scalars['String']['input'];
  plan: VendorPlan;
};


export type MutationUpdateVendorProfileArgs = {
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUploadFromUrlArgs = {
  folder?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};


export type MutationUploadImageArgs = {
  base64: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
};


export type MutationValidateDocumentPhotoArgs = {
  imageUrl: Scalars['String']['input'];
};


export type MutationValidateFacePhotoArgs = {
  imageUrl: Scalars['String']['input'];
};


export type MutationValidateRegistrationArgs = {
  cpf: Scalars['String']['input'];
  email: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  userType?: Scalars['String']['input'];
};


export type MutationVendorCancelAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationVendorCancelOrderArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationVendorConfirmPickupArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationVerifyCodeArgs = {
  input: VerifyCodeInput;
};

export type NotificationLog = {
  __typename?: 'NotificationLog';
  createdAt: Scalars['DateTime']['output'];
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  retryCount: Scalars['Float']['output'];
  subject: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  to: Scalars['String']['output'];
  type: Scalars['String']['output'];
  userName: Scalars['String']['output'];
  vendorId?: Maybe<Scalars['String']['output']>;
};

export type Order = {
  __typename?: 'Order';
  capturedAt?: Maybe<Scalars['DateTime']['output']>;
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  commissionAmount?: Maybe<Scalars['Float']['output']>;
  commissionPercent?: Maybe<Scalars['Float']['output']>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  coupon?: Maybe<Coupon>;
  couponCode?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  customerConfirmedAt?: Maybe<Scalars['DateTime']['output']>;
  delivererConfirmedDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  delivery?: Maybe<Delivery>;
  deliveryAddress?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  deliveryLatitude?: Maybe<Scalars['Float']['output']>;
  deliveryLongitude?: Maybe<Scalars['Float']['output']>;
  discount?: Maybe<Scalars['Float']['output']>;
  disputeReason?: Maybe<Scalars['String']['output']>;
  disputeResolution?: Maybe<Scalars['String']['output']>;
  disputeResolvedAt?: Maybe<Scalars['DateTime']['output']>;
  disputedAt?: Maybe<Scalars['DateTime']['output']>;
  estimatedDeliveryEta?: Maybe<Scalars['DateTime']['output']>;
  estimatedPickupEta?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isPickup: Scalars['Boolean']['output'];
  isSettled: Scalars['Boolean']['output'];
  items: Array<OrderItem>;
  mpPreferenceId?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  orderNumber: Scalars['String']['output'];
  paymentMethod?: Maybe<Scalars['String']['output']>;
  pixQrCode?: Maybe<Scalars['String']['output']>;
  pixQrCodeBase64?: Maybe<Scalars['String']['output']>;
  preAuthChargeId?: Maybe<Scalars['String']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  status: OrderStatus;
  store: Store;
  subtotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  vendorConfirmedPickupAt?: Maybe<Scalars['DateTime']['output']>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  order: Order;
  product?: Maybe<Product>;
  quantity: Scalars['Int']['output'];
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
  weightGrams?: Maybe<Scalars['Int']['output']>;
};

export type OrderItemInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  weightGrams?: InputMaybe<Scalars['Int']['input']>;
};

export enum OrderStatus {
  Accepted = 'ACCEPTED',
  AwaitingPayment = 'AWAITING_PAYMENT',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Delivered = 'DELIVERED',
  DelivererConfirmedDelivery = 'DELIVERER_CONFIRMED_DELIVERY',
  Delivering = 'DELIVERING',
  Disputed = 'DISPUTED',
  Expired = 'EXPIRED',
  PaymentReview = 'PAYMENT_REVIEW',
  Pending = 'PENDING',
  PickedUp = 'PICKED_UP',
  Preparing = 'PREPARING',
  Ready = 'READY',
  Rejected = 'REJECTED',
  VendorConfirmedPickup = 'VENDOR_CONFIRMED_PICKUP'
}

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  appUser?: Maybe<AppUser>;
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  mpPaymentId?: Maybe<Scalars['String']['output']>;
  mpPreferenceId?: Maybe<Scalars['String']['output']>;
  pagarmeOrderId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
  vendorUser?: Maybe<VendorUser>;
};

export type PhotoValidation = {
  __typename?: 'PhotoValidation';
  message: Scalars['String']['output'];
  valid: Scalars['Boolean']['output'];
};

export type PlanInfo = {
  __typename?: 'PlanInfo';
  annualPrice: Scalars['Float']['output'];
  canUseCoupons: Scalars['Boolean']['output'];
  commissionPercent: Scalars['Float']['output'];
  freePromosPerWeek: Scalars['Int']['output'];
  hasAnalytics: Scalars['Boolean']['output'];
  highlightDaysPerMonth: Scalars['Int']['output'];
  isContactSales: Scalars['Boolean']['output'];
  listingPriority: Scalars['Int']['output'];
  maxEmailsPerMonth: Scalars['Int']['output'];
  maxProductsPerStore: Scalars['Int']['output'];
  maxStores: Scalars['Int']['output'];
  monthlyPrice: Scalars['Float']['output'];
  plan: VendorPlan;
  quarterlyPrice: Scalars['Float']['output'];
  semiannualPrice: Scalars['Float']['output'];
  supportLevel: Scalars['String']['output'];
};

export type PlatformConfig = {
  __typename?: 'PlatformConfig';
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['String']['output'];
};

export type PopularProduct = {
  __typename?: 'PopularProduct';
  categoryId?: Maybe<Scalars['String']['output']>;
  categoryName?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isAvailable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  promotionalPrice?: Maybe<Scalars['Float']['output']>;
  storeId: Scalars['String']['output'];
  storeIsOpen: Scalars['Boolean']['output'];
  storeLogoUrl?: Maybe<Scalars['String']['output']>;
  storeName: Scalars['String']['output'];
  totalSold: Scalars['Int']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};

export type Product = {
  __typename?: 'Product';
  barcode?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Category>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isAvailable: Scalars['Boolean']['output'];
  isVariableWeight: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  promotionalPrice?: Maybe<Scalars['Float']['output']>;
  stock: Scalars['Float']['output'];
  store: Store;
  unit?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ProductDeletedPayload = {
  __typename?: 'ProductDeletedPayload';
  id: Scalars['ID']['output'];
  storeId?: Maybe<Scalars['String']['output']>;
};

export type Promotion = {
  __typename?: 'Promotion';
  adCost: Scalars['Float']['output'];
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isPaid: Scalars['Boolean']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  product?: Maybe<Product>;
  promotionalPrice: Scalars['Float']['output'];
  startDate: Scalars['DateTime']['output'];
  store: Store;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  activePromotions: Array<Promotion>;
  allAppUsers: Array<AppUser>;
  allCoupons: Array<Coupon>;
  allDeliveries: Array<Delivery>;
  allOrders: Array<Order>;
  allPayments: Array<Payment>;
  allPromotions: Array<Promotion>;
  allServicesByStore: Array<Service>;
  allStores: Array<Store>;
  allVendorUsers: Array<VendorUser>;
  appointment: Appointment;
  approvalLogs: Array<ApprovalLog>;
  availableDeliveries: Array<Order>;
  availablePlans: Array<PlanInfo>;
  availableSlots: Array<Scalars['String']['output']>;
  averageStoreRating: Scalars['Float']['output'];
  badgeConfig: Scalars['String']['output'];
  calculateDeliveryFee: Scalars['Float']['output'];
  categoriesByStore: Array<Category>;
  contractContent: Scalars['String']['output'];
  contractUpdatedAt?: Maybe<Scalars['String']['output']>;
  dashboardStats: DashboardStats;
  deletedProductsByStore: Array<Product>;
  deliveryBasePrice: Scalars['Float']['output'];
  deliveryCommissionPercent: Scalars['Float']['output'];
  deliveryPricePerKm: Scalars['Float']['output'];
  disputedOrders: Array<Order>;
  estimatedDeliveryTime: Scalars['Float']['output'];
  followedStores: Array<Store>;
  followerCount: Scalars['Int']['output'];
  frequentStores: Array<FrequentStore>;
  isFollowingStore: Scalars['Boolean']['output'];
  lookupBarcode: BarcodeLookupResult;
  meApp: AppUser;
  meVendor: VendorUser;
  minimumOrderPlatform: Scalars['Float']['output'];
  myAddresses: Array<Address>;
  myAppointments: Array<Appointment>;
  myBalance: RecipientBalance;
  myCards: Array<SavedCard>;
  myCart: Array<CartItem>;
  myCartByStore: Array<CartItem>;
  myDeliveries: Array<Delivery>;
  myOrders: Array<Order>;
  myPayments: Array<Payment>;
  myPromotions: Array<Promotion>;
  myStores: Array<Store>;
  nearbyStores: Array<Store>;
  notificationLogs: Array<NotificationLog>;
  onlineDeliverersCount: Scalars['Int']['output'];
  order: Order;
  pendingAppApprovals: Array<AppUser>;
  pendingVendorApprovals: Array<VendorUser>;
  platformConfigs: Array<PlatformConfig>;
  popularProducts: Array<PopularProduct>;
  product: Product;
  productsByStore: Array<Product>;
  productsByStoreAll: Array<Product>;
  promoPricePerDay: Scalars['Float']['output'];
  ratingForAppointment?: Maybe<ServiceRating>;
  reorderSuggestions: Array<ReorderProduct>;
  searchCatalog: Array<Product>;
  searchProductImages: Array<Scalars['String']['output']>;
  searchProducts: Array<Product>;
  searchServices: Array<Service>;
  service: Service;
  serviceRatings: Array<ServiceRating>;
  servicesByStore: Array<Service>;
  simulateAnticipation: AnticipationSimulation;
  store: Store;
  storeAppointments: Array<Appointment>;
  storeCartSummary: Array<CartProductSummary>;
  storeCoupons: Array<Coupon>;
  storeOrders: Array<Order>;
  storeSchedule: Array<Schedule>;
  stores: Array<Store>;
  topStoresWeekly: Array<WeeklyTopStore>;
  validateCoupon: CouponValidation;
};


export type QueryAllPaymentsArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryAllServicesByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryAvailableSlotsArgs = {
  date: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type QueryAverageStoreRatingArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryCalculateDeliveryFeeArgs = {
  customerLatitude: Scalars['Float']['input'];
  customerLongitude: Scalars['Float']['input'];
  storeId: Scalars['String']['input'];
};


export type QueryCategoriesByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryContractContentArgs = {
  type: Scalars['String']['input'];
};


export type QueryContractUpdatedAtArgs = {
  type: Scalars['String']['input'];
};


export type QueryDeletedProductsByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryEstimatedDeliveryTimeArgs = {
  customerLatitude: Scalars['Float']['input'];
  customerLongitude: Scalars['Float']['input'];
  storeId: Scalars['String']['input'];
};


export type QueryFollowerCountArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryFrequentStoresArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryIsFollowingStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryLookupBarcodeArgs = {
  barcode: Scalars['String']['input'];
};


export type QueryMyCartByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryNearbyStoresArgs = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryOrderArgs = {
  id: Scalars['String']['input'];
};


export type QueryPopularProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryProductArgs = {
  id: Scalars['String']['input'];
};


export type QueryProductsByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryProductsByStoreAllArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryRatingForAppointmentArgs = {
  appointmentId: Scalars['String']['input'];
};


export type QueryReorderSuggestionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySearchCatalogArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchProductImagesArgs = {
  query: Scalars['String']['input'];
};


export type QuerySearchProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchServicesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryServiceArgs = {
  id: Scalars['String']['input'];
};


export type QueryServiceRatingsArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryServicesByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreArgs = {
  id: Scalars['String']['input'];
};


export type QueryStoreAppointmentsArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AppointmentStatus>;
  storeId: Scalars['String']['input'];
};


export type QueryStoreCartSummaryArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreCouponsArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreOrdersArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreScheduleArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryTopStoresWeeklyArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryValidateCouponArgs = {
  code: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
  subtotal: Scalars['Float']['input'];
};

export type RecentOrder = {
  __typename?: 'RecentOrder';
  createdAt: Scalars['DateTime']['output'];
  customerName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  orderNumber: Scalars['String']['output'];
  status: Scalars['String']['output'];
  storeName: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type RecipientBalance = {
  __typename?: 'RecipientBalance';
  autoAnticipationEnabled: Scalars['Boolean']['output'];
  availableAmount: Scalars['Float']['output'];
  transferredAmount: Scalars['Float']['output'];
  waitingFundsAmount: Scalars['Float']['output'];
};

export type RegisterAppInput = {
  cpf: Scalars['String']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type RegisterDelivererInput = {
  birthDate: Scalars['String']['input'];
  cnhNumber?: InputMaybe<Scalars['String']['input']>;
  identityPhotoBackUrl?: InputMaybe<Scalars['String']['input']>;
  identityPhotoUrl?: InputMaybe<Scalars['String']['input']>;
  profilePhotoUrl?: InputMaybe<Scalars['String']['input']>;
  vehiclePlate?: InputMaybe<Scalars['String']['input']>;
  vehicleType: Scalars['String']['input'];
};

export type RegisterVendorInput = {
  cpf: Scalars['String']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type ReorderProduct = {
  __typename?: 'ReorderProduct';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isAvailable: Scalars['Boolean']['output'];
  lastOrderedAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  promotionalPrice?: Maybe<Scalars['Float']['output']>;
  storeId: Scalars['String']['output'];
  storeIsOpen: Scalars['Boolean']['output'];
  storeLogoUrl?: Maybe<Scalars['String']['output']>;
  storeName: Scalars['String']['output'];
};

export type RequestQuoteInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  serviceId: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};

export type RoleCount = {
  __typename?: 'RoleCount';
  count: Scalars['Int']['output'];
  role: Scalars['String']['output'];
};

export type SavedCard = {
  __typename?: 'SavedCard';
  brand: Scalars['String']['output'];
  expMonth: Scalars['Int']['output'];
  expYear: Scalars['Int']['output'];
  holderName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastFourDigits: Scalars['String']['output'];
};

export type Schedule = {
  __typename?: 'Schedule';
  dayOfWeek: Scalars['Int']['output'];
  endTime: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  startTime: Scalars['String']['output'];
  store: Store;
};

export type ScheduleEntryInput = {
  dayOfWeek: Scalars['Int']['input'];
  endTime: Scalars['String']['input'];
  isActive?: Scalars['Boolean']['input'];
  startTime: Scalars['String']['input'];
};

export type SendCodeInput = {
  channel: Scalars['String']['input'];
  fallbackEmail?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

export type Service = {
  __typename?: 'Service';
  category?: Maybe<Category>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  estimatedDuration: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isAvailable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  requiresQuote: Scalars['Boolean']['output'];
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
};

export type ServiceRating = {
  __typename?: 'ServiceRating';
  appointment: Appointment;
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  id: Scalars['ID']['output'];
  photoUrls?: Maybe<Array<Scalars['String']['output']>>;
  rating: Scalars['Int']['output'];
  service: Service;
  store: Store;
};

export type SessionKickedPayload = {
  __typename?: 'SessionKickedPayload';
  userId: Scalars['String']['output'];
  userType: Scalars['String']['output'];
};

export type SetScheduleInput = {
  entries: Array<ScheduleEntryInput>;
  storeId: Scalars['String']['input'];
};

export type StatusCount = {
  __typename?: 'StatusCount';
  count: Scalars['Int']['output'];
  status: Scalars['String']['output'];
};

export type Store = {
  __typename?: 'Store';
  badgeClaimCount: Scalars['Int']['output'];
  bannerUrl?: Maybe<Scalars['String']['output']>;
  categories?: Maybe<Array<Category>>;
  city: Scalars['String']['output'];
  commissionReductionExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  commissionReductionPercent: Scalars['Float']['output'];
  complement?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deliveryEndTime?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  deliveryStartTime?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estimatedDeliveryMinutes: Scalars['Float']['output'];
  freeDelivery: Scalars['Boolean']['output'];
  freeDeliveryAbove?: Maybe<Scalars['Float']['output']>;
  freePromoDaysCredit: Scalars['Int']['output'];
  hasOwnDelivery: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isOpen: Scalars['Boolean']['output'];
  lastClaimedScore: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  longitude: Scalars['Float']['output'];
  minimumOrder: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  neighborhood: Scalars['String']['output'];
  number: Scalars['String']['output'];
  owner: VendorUser;
  ownerPaymentConnected: Scalars['Boolean']['output'];
  phone: Scalars['String']['output'];
  products?: Maybe<Array<Product>>;
  services?: Maybe<Array<Service>>;
  state: Scalars['String']['output'];
  storeType: StoreType;
  street: Scalars['String']['output'];
  totalProducts: Scalars['Int']['output'];
  totalSales: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  verificationLevel: VerificationLevel;
  verificationScore: Scalars['Int']['output'];
  zipCode: Scalars['String']['output'];
};

export enum StoreType {
  Products = 'PRODUCTS',
  Services = 'SERVICES'
}

export type Subscription = {
  __typename?: 'Subscription';
  deliveryUpdated: Delivery;
  orderCreated: Order;
  orderUpdated: Order;
  productDeleted: ProductDeletedPayload;
  productUpdated: Product;
  promotionUpdated: Promotion;
  sessionKicked: SessionKickedPayload;
  storeUpdated: Store;
};


export type SubscriptionDeliveryUpdatedArgs = {
  orderId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOrderCreatedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOrderUpdatedArgs = {
  orderId?: InputMaybe<Scalars['String']['input']>;
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionProductDeletedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionProductUpdatedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionSessionKickedArgs = {
  userId: Scalars['String']['input'];
  userType?: Scalars['String']['input'];
};


export type SubscriptionStoreUpdatedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};

export type TopStore = {
  __typename?: 'TopStore';
  orderCount: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
  storeId: Scalars['String']['output'];
  storeName: Scalars['String']['output'];
};

export type UpdateAddressInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  complement?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  neighborhood?: InputMaybe<Scalars['String']['input']>;
  number?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCartItemInput = {
  cartItemId: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  weightGrams?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateCouponInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  discountType?: InputMaybe<Scalars['String']['input']>;
  discountValue?: InputMaybe<Scalars['Float']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['String']['input'];
  maxDiscount?: InputMaybe<Scalars['Float']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isVariableWeight?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  stock?: InputMaybe<Scalars['Float']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateServiceInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDuration?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isAvailable?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  requiresQuote?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateStoreInput = {
  bannerUrl?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  complement?: InputMaybe<Scalars['String']['input']>;
  deliveryEndTime?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  deliveryStartTime?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDeliveryMinutes?: InputMaybe<Scalars['Float']['input']>;
  freeDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  freeDeliveryAbove?: InputMaybe<Scalars['Float']['input']>;
  hasOwnDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  neighborhood?: InputMaybe<Scalars['String']['input']>;
  number?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  storeType?: InputMaybe<StoreType>;
  street?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export enum UserRole {
  Admin = 'ADMIN',
  Customer = 'CUSTOMER',
  Deliverer = 'DELIVERER',
  Superadmin = 'SUPERADMIN',
  Vendor = 'VENDOR'
}

export type ValidationResult = {
  __typename?: 'ValidationResult';
  cpfError?: Maybe<Scalars['String']['output']>;
  emailError?: Maybe<Scalars['String']['output']>;
  phoneError?: Maybe<Scalars['String']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type VendorAuthResponse = {
  __typename?: 'VendorAuthResponse';
  accessToken: Scalars['String']['output'];
  user: VendorUser;
};

export enum VendorPlan {
  Custom = 'CUSTOM',
  Enterprise = 'ENTERPRISE',
  Free = 'FREE',
  Premium = 'PREMIUM',
  Pro = 'PRO'
}

export type VendorUser = {
  __typename?: 'VendorUser';
  acceptedSubscriptionTermsAt?: Maybe<Scalars['DateTime']['output']>;
  acceptedTermsAt?: Maybe<Scalars['DateTime']['output']>;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  cpf?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  googleId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pagarmeRecipientId?: Maybe<Scalars['String']['output']>;
  paymentConnected: Scalars['Boolean']['output'];
  pendingRole?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
  phoneVerified: Scalars['Boolean']['output'];
  planExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  stores?: Maybe<Array<Store>>;
  updatedAt: Scalars['DateTime']['output'];
  vendorPlan?: Maybe<VendorPlan>;
};

export enum VerificationLevel {
  Bronze = 'BRONZE',
  Diamond = 'DIAMOND',
  Gold = 'GOLD',
  None = 'NONE',
  Silver = 'SILVER'
}

export type VerifyCodeInput = {
  channel: Scalars['String']['input'];
  code: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type WeeklyTopStore = {
  __typename?: 'WeeklyTopStore';
  bannerUrl?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  freeDelivery: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isOpen: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  orderCount: Scalars['Int']['output'];
  totalRevenue: Scalars['Float']['output'];
  verificationLevel?: Maybe<Scalars['String']['output']>;
};

export type RegisterAppMutationVariables = Exact<{
  input: RegisterAppInput;
}>;


export type RegisterAppMutation = { __typename?: 'Mutation', registerApp: { __typename?: 'AppAuthResponse', accessToken: string, user: { __typename?: 'AppUser', id: string, name: string, email: string, cpf?: string | null, role: UserRole, isDeliverer: boolean, pendingRole?: string | null, rejectedAt?: any | null, rejectionReason?: string | null, acceptedTermsAt?: any | null, emailVerified: boolean, phoneVerified: boolean } } };

export type ValidateRegistrationMutationVariables = Exact<{
  email: Scalars['String']['input'];
  cpf: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ValidateRegistrationMutation = { __typename?: 'Mutation', validateRegistration: { __typename?: 'ValidationResult', valid: boolean, emailError?: string | null, cpfError?: string | null, phoneError?: string | null } };

export type SendVerificationCodeMutationVariables = Exact<{
  input: SendCodeInput;
}>;


export type SendVerificationCodeMutation = { __typename?: 'Mutation', sendVerificationCode: string };

export type VerifyCodeMutationVariables = Exact<{
  input: VerifyCodeInput;
}>;


export type VerifyCodeMutation = { __typename?: 'Mutation', verifyCode: boolean };

export type SendEmailVerificationMutationVariables = Exact<{
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type SendEmailVerificationMutation = { __typename?: 'Mutation', sendEmailVerification: boolean };

export type ConfirmEmailVerificationMutationVariables = Exact<{
  code: Scalars['String']['input'];
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ConfirmEmailVerificationMutation = { __typename?: 'Mutation', confirmEmailVerification: boolean };

export type LoginAppMutationVariables = Exact<{
  input: LoginInput;
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type LoginAppMutation = { __typename?: 'Mutation', loginApp: { __typename?: 'AppAuthResponse', accessToken: string, user: { __typename?: 'AppUser', id: string, name: string, email: string, cpf?: string | null, role: UserRole, isDeliverer: boolean, pendingRole?: string | null, rejectedAt?: any | null, rejectionReason?: string | null, acceptedTermsAt?: any | null, emailVerified: boolean, phoneVerified: boolean } } };

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;


export type CreateOrderMutation = { __typename?: 'Mutation', createOrder: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, paymentMethod?: string | null, checkoutUrl?: string | null, pixQrCode?: string | null, pixQrCodeBase64?: string | null, createdAt: any } };

export type RegisterAsDelivererMutationVariables = Exact<{
  input: RegisterDelivererInput;
}>;


export type RegisterAsDelivererMutation = { __typename?: 'Mutation', registerAsDeliverer: { __typename?: 'AppUser', id: string, name: string, email: string, role: UserRole, isDeliverer: boolean, pendingRole?: string | null, vehicleType?: string | null, vehiclePlate?: string | null, identityPhotoUrl?: string | null, identityPhotoBackUrl?: string | null, profilePhotoUrl?: string | null, birthDate?: string | null, cnhNumber?: string | null, acceptedTermsAt?: any | null } };

export type AcceptDeliveryMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type AcceptDeliveryMutation = { __typename?: 'Mutation', acceptDelivery: { __typename?: 'Delivery', id: string, order: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, deliveryAddress?: string | null, store: { __typename?: 'Store', name: string, latitude: number, longitude: number, street: string, number: string, neighborhood: string, city: string } } } };

export type ConfirmPickupMutationVariables = Exact<{
  deliveryId: Scalars['String']['input'];
}>;


export type ConfirmPickupMutation = { __typename?: 'Mutation', confirmPickup: { __typename?: 'Delivery', id: string, pickedUpAt?: any | null, order: { __typename?: 'Order', id: string, status: OrderStatus } } };

export type UploadImageMutationVariables = Exact<{
  base64: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
}>;


export type UploadImageMutation = { __typename?: 'Mutation', uploadImage: string };

export type ConfirmDeliveryMutationVariables = Exact<{
  deliveryId: Scalars['String']['input'];
}>;


export type ConfirmDeliveryMutation = { __typename?: 'Mutation', confirmDelivery: { __typename?: 'Delivery', id: string, deliveredAt?: any | null, order: { __typename?: 'Order', id: string, status: OrderStatus } } };

export type CreateAddressMutationVariables = Exact<{
  input: CreateAddressInput;
}>;


export type CreateAddressMutation = { __typename?: 'Mutation', createAddress: { __typename?: 'Address', id: string, street: string, number: string, complement?: string | null, neighborhood: string, city: string, state: string, zipCode: string, latitude: number, longitude: number, isDefault: boolean } };

export type SetDefaultAddressMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type SetDefaultAddressMutation = { __typename?: 'Mutation', setDefaultAddress: { __typename?: 'Address', id: string, isDefault: boolean } };

export type UpdateAddressMutationVariables = Exact<{
  input: UpdateAddressInput;
}>;


export type UpdateAddressMutation = { __typename?: 'Mutation', updateAddress: { __typename?: 'Address', id: string, street: string, number: string, complement?: string | null, neighborhood: string, city: string, state: string, zipCode: string, latitude: number, longitude: number, isDefault: boolean } };

export type DeleteAddressMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAddressMutation = { __typename?: 'Mutation', deleteAddress: boolean };

export type DisconnectPaymentMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectPaymentMutation = { __typename?: 'Mutation', disconnectPayment: boolean };

export type SaveCardMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type SaveCardMutation = { __typename?: 'Mutation', saveCard: { __typename?: 'SavedCard', id: string, lastFourDigits: string, brand: string, holderName: string, expMonth: number, expYear: number } };

export type DeleteCardMutationVariables = Exact<{
  cardId: Scalars['String']['input'];
}>;


export type DeleteCardMutation = { __typename?: 'Mutation', deleteCard: boolean };

export type FollowStoreMutationVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type FollowStoreMutation = { __typename?: 'Mutation', followStore: boolean };

export type UnfollowStoreMutationVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type UnfollowStoreMutation = { __typename?: 'Mutation', unfollowStore: boolean };

export type UpdateAppProfileMutationVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateAppProfileMutation = { __typename?: 'Mutation', updateAppProfile: { __typename?: 'AppUser', id: string, name: string, phone: string, avatarUrl?: string | null } };

export type RegisterAppPushTokenMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type RegisterAppPushTokenMutation = { __typename?: 'Mutation', registerAppPushToken: boolean };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type AcceptAppTermsMutationVariables = Exact<{ [key: string]: never; }>;


export type AcceptAppTermsMutation = { __typename?: 'Mutation', acceptAppTerms: { __typename?: 'AppUser', id: string, acceptedTermsAt?: any | null } };

export type ConfirmReceiptMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type ConfirmReceiptMutation = { __typename?: 'Mutation', confirmReceipt: { __typename?: 'Order', id: string, status: OrderStatus, customerConfirmedAt?: any | null } };

export type RequestPasswordResetAppMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestPasswordResetAppMutation = { __typename?: 'Mutation', requestPasswordResetApp: string };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: boolean };

export type GoogleAuthAppMutationVariables = Exact<{
  idToken: Scalars['String']['input'];
}>;


export type GoogleAuthAppMutation = { __typename?: 'Mutation', googleAuthApp: { __typename?: 'AppAuthResponse', accessToken: string, user: { __typename?: 'AppUser', id: string, name: string, email: string, cpf?: string | null, role: UserRole, isDeliverer: boolean, pendingRole?: string | null, rejectedAt?: any | null, rejectionReason?: string | null, acceptedTermsAt?: any | null, emailVerified: boolean, phoneVerified: boolean } } };

export type AddToCartMutationVariables = Exact<{
  input: AddToCartInput;
}>;


export type AddToCartMutation = { __typename?: 'Mutation', addToCart: { __typename?: 'CartItem', id: string, quantity: number, notes?: string | null, weightGrams?: number | null, product: { __typename?: 'Product', id: string, name: string, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isVariableWeight: boolean, unit?: string | null }, store: { __typename?: 'Store', id: string, name: string } } };

export type UpdateCartItemMutationVariables = Exact<{
  input: UpdateCartItemInput;
}>;


export type UpdateCartItemMutation = { __typename?: 'Mutation', updateCartItem: { __typename?: 'CartItem', id: string, quantity: number, notes?: string | null, weightGrams?: number | null } };

export type RemoveFromCartMutationVariables = Exact<{
  cartItemId: Scalars['String']['input'];
}>;


export type RemoveFromCartMutation = { __typename?: 'Mutation', removeFromCart: boolean };

export type ClearCartMutationVariables = Exact<{ [key: string]: never; }>;


export type ClearCartMutation = { __typename?: 'Mutation', clearCart: boolean };

export type ClearCartByStoreMutationVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type ClearCartByStoreMutation = { __typename?: 'Mutation', clearCartByStore: boolean };

export type ValidateFacePhotoMutationVariables = Exact<{
  imageUrl: Scalars['String']['input'];
}>;


export type ValidateFacePhotoMutation = { __typename?: 'Mutation', validateFacePhoto: { __typename?: 'PhotoValidation', valid: boolean, message: string } };

export type ValidateDocumentPhotoMutationVariables = Exact<{
  imageUrl: Scalars['String']['input'];
}>;


export type ValidateDocumentPhotoMutation = { __typename?: 'Mutation', validateDocumentPhoto: { __typename?: 'PhotoValidation', valid: boolean, message: string } };

export type RegisterRecipientMutationVariables = Exact<{
  recipientData: Scalars['String']['input'];
}>;


export type RegisterRecipientMutation = { __typename?: 'Mutation', registerRecipient: boolean };

export type RequestAnticipationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestAnticipationMutation = { __typename?: 'Mutation', requestAnticipation: { __typename?: 'AnticipationResult', id: string, status: string, requestedAmount: number, approvedAmount: number, fee: number, createdAt: string } };

export type ToggleAutoAnticipationMutationVariables = Exact<{
  enabled: Scalars['Boolean']['input'];
}>;


export type ToggleAutoAnticipationMutation = { __typename?: 'Mutation', toggleAutoAnticipation: boolean };

export type CustomerDenyDeliveryMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
}>;


export type CustomerDenyDeliveryMutation = { __typename?: 'Mutation', customerDenyDelivery: { __typename?: 'Order', id: string, status: OrderStatus } };

export type DisputeCompletedOrderMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
}>;


export type DisputeCompletedOrderMutation = { __typename?: 'Mutation', disputeCompletedOrder: { __typename?: 'Order', id: string, status: OrderStatus } };

export type CancelDisputeMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type CancelDisputeMutation = { __typename?: 'Mutation', cancelDispute: { __typename?: 'Order', id: string, status: OrderStatus } };

export type CancelOrderMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type CancelOrderMutation = { __typename?: 'Mutation', cancelOrder: { __typename?: 'Order', id: string, status: OrderStatus } };

export type RegisterAppWithGoogleMutationVariables = Exact<{
  idToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  cpf: Scalars['String']['input'];
}>;


export type RegisterAppWithGoogleMutation = { __typename?: 'Mutation', registerAppWithGoogle: { __typename?: 'AppAuthResponse', accessToken: string, user: { __typename?: 'AppUser', id: string, name: string, email: string, cpf?: string | null, role: UserRole, isDeliverer: boolean, pendingRole?: string | null, rejectedAt?: any | null, rejectionReason?: string | null, acceptedTermsAt?: any | null, emailVerified: boolean, phoneVerified: boolean } } };

export type CreateAppointmentMutationVariables = Exact<{
  input: CreateAppointmentInput;
}>;


export type CreateAppointmentMutation = { __typename?: 'Mutation', createAppointment: { __typename?: 'Appointment', id: string, appointmentNumber: string, scheduledDate: string, scheduledTime: string, status: AppointmentStatus, price?: number | null, paymentMethod?: string | null, paymentStatus?: string | null, checkoutUrl?: string | null, pixQrCode?: string | null, pixQrCodeBase64?: string | null, store: { __typename?: 'Store', id: string, name: string }, service: { __typename?: 'Service', id: string, name: string } } };

export type CancelAppointmentMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CancelAppointmentMutation = { __typename?: 'Mutation', cancelAppointment: { __typename?: 'Appointment', id: string, status: AppointmentStatus } };

export type RequestQuoteMutationVariables = Exact<{
  input: RequestQuoteInput;
}>;


export type RequestQuoteMutation = { __typename?: 'Mutation', requestQuote: { __typename?: 'Appointment', id: string, appointmentNumber: string, status: AppointmentStatus, quoteDescription?: string | null, store: { __typename?: 'Store', id: string, name: string }, service: { __typename?: 'Service', id: string, name: string } } };

export type AcceptQuoteMutationVariables = Exact<{
  id: Scalars['String']['input'];
  scheduledDate: Scalars['String']['input'];
  scheduledTime: Scalars['String']['input'];
}>;


export type AcceptQuoteMutation = { __typename?: 'Mutation', acceptQuote: { __typename?: 'Appointment', id: string, status: AppointmentStatus, scheduledDate: string, scheduledTime: string } };

export type RejectQuoteMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RejectQuoteMutation = { __typename?: 'Mutation', rejectQuote: { __typename?: 'Appointment', id: string, status: AppointmentStatus } };

export type RateServiceMutationVariables = Exact<{
  input: CreateServiceRatingInput;
}>;


export type RateServiceMutation = { __typename?: 'Mutation', rateService: { __typename?: 'ServiceRating', id: string, rating: number, comment?: string | null, createdAt: any } };

export type StoresQueryVariables = Exact<{ [key: string]: never; }>;


export type StoresQuery = { __typename?: 'Query', stores: Array<{ __typename?: 'Store', id: string, name: string, description?: string | null, logoUrl?: string | null, bannerUrl?: string | null, isOpen: boolean, latitude: number, longitude: number, hasOwnDelivery: boolean, freeDelivery: boolean, freeDeliveryAbove?: number | null, deliveryFee: number, estimatedDeliveryMinutes: number, deliveryStartTime?: string | null, deliveryEndTime?: string | null, minimumOrder: number, verificationLevel: VerificationLevel, verificationScore: number, storeType: StoreType }> };

export type NearbyStoresQueryVariables = Exact<{
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm?: InputMaybe<Scalars['Float']['input']>;
}>;


export type NearbyStoresQuery = { __typename?: 'Query', nearbyStores: Array<{ __typename?: 'Store', id: string, name: string, description?: string | null, logoUrl?: string | null, bannerUrl?: string | null, isOpen: boolean, latitude: number, longitude: number, hasOwnDelivery: boolean, freeDelivery: boolean, freeDeliveryAbove?: number | null, deliveryFee: number, estimatedDeliveryMinutes: number, deliveryStartTime?: string | null, deliveryEndTime?: string | null, minimumOrder: number, verificationLevel: VerificationLevel, verificationScore: number }> };

export type DeliveryPricingQueryVariables = Exact<{ [key: string]: never; }>;


export type DeliveryPricingQuery = { __typename?: 'Query', deliveryBasePrice: number, deliveryPricePerKm: number };

export type StoreQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type StoreQuery = { __typename?: 'Query', store: { __typename?: 'Store', id: string, name: string, description?: string | null, logoUrl?: string | null, bannerUrl?: string | null, isOpen: boolean, hasOwnDelivery: boolean, ownerPaymentConnected: boolean, freeDelivery: boolean, freeDeliveryAbove?: number | null, deliveryFee: number, estimatedDeliveryMinutes: number, minimumOrder: number, verificationLevel: VerificationLevel, verificationScore: number, storeType: StoreType, products?: Array<{ __typename?: 'Product', id: string, name: string, description?: string | null, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, isVariableWeight: boolean, unit?: string | null, category?: { __typename?: 'Category', id: string, name: string, requiresAgeVerification: boolean } | null }> | null, services?: Array<{ __typename?: 'Service', id: string, name: string, description?: string | null, price?: number | null, estimatedDuration: number, imageUrl?: string | null, isAvailable: boolean, isActive: boolean, requiresQuote: boolean, category?: { __typename?: 'Category', id: string, name: string } | null }> | null, categories?: Array<{ __typename?: 'Category', id: string, name: string, requiresAgeVerification: boolean }> | null } };

export type MyCartQueryVariables = Exact<{ [key: string]: never; }>;


export type MyCartQuery = { __typename?: 'Query', myCart: Array<{ __typename?: 'CartItem', id: string, quantity: number, notes?: string | null, weightGrams?: number | null, product: { __typename?: 'Product', id: string, name: string, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, isVariableWeight: boolean, unit?: string | null }, store: { __typename?: 'Store', id: string, name: string } }> };

export type MyCartByStoreQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type MyCartByStoreQuery = { __typename?: 'Query', myCartByStore: Array<{ __typename?: 'CartItem', id: string, quantity: number, notes?: string | null, weightGrams?: number | null, product: { __typename?: 'Product', id: string, name: string, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, isVariableWeight: boolean, unit?: string | null }, store: { __typename?: 'Store', id: string, name: string } }> };

export type MyOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type MyOrdersQuery = { __typename?: 'Query', myOrders: Array<{ __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, customerConfirmedAt?: any | null, rejectionReason?: string | null, createdAt: any, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, weightGrams?: number | null, totalPrice: number, product?: { __typename?: 'Product', name: string } | null }>, delivery?: { __typename?: 'Delivery', id: string, deliveredAt?: any | null } | null }> };

export type OrderQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OrderQuery = { __typename?: 'Query', order: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, subtotal: number, deliveryFee: number, total: number, paymentMethod?: string | null, checkoutUrl?: string | null, pixQrCode?: string | null, pixQrCodeBase64?: string | null, notes?: string | null, deliveryAddress?: string | null, customerConfirmedAt?: any | null, vendorConfirmedPickupAt?: any | null, delivererConfirmedDeliveryAt?: any | null, completedAt?: any | null, disputedAt?: any | null, disputeReason?: string | null, estimatedDeliveryEta?: any | null, rejectedAt?: any | null, rejectionReason?: string | null, createdAt: any, deliveryLatitude?: number | null, deliveryLongitude?: number | null, store: { __typename?: 'Store', id: string, name: string, phone: string }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, weightGrams?: number | null, unitPrice: number, totalPrice: number, product?: { __typename?: 'Product', id: string, name: string, imageUrl?: string | null } | null }>, delivery?: { __typename?: 'Delivery', id: string, currentLatitude?: number | null, currentLongitude?: number | null, deliveredAt?: any | null, deliverer?: { __typename?: 'AppUser', name: string, phone: string, profilePhotoUrl?: string | null } | null } | null } };

export type ActivePromotionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActivePromotionsQuery = { __typename?: 'Query', activePromotions: Array<{ __typename?: 'Promotion', id: string, title: string, description?: string | null, imageUrl?: string | null, startDate: any, endDate: any, promotionalPrice: number, product?: { __typename?: 'Product', id: string, name: string, imageUrl?: string | null, price: number, description?: string | null } | null, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null, deliveryFee: number, estimatedDeliveryMinutes: number, freeDelivery: boolean, isOpen: boolean, verificationLevel: VerificationLevel } }> };

export type CalculateDeliveryFeeQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
  customerLatitude: Scalars['Float']['input'];
  customerLongitude: Scalars['Float']['input'];
}>;


export type CalculateDeliveryFeeQuery = { __typename?: 'Query', calculateDeliveryFee: number };

export type MinimumOrderPlatformQueryVariables = Exact<{ [key: string]: never; }>;


export type MinimumOrderPlatformQuery = { __typename?: 'Query', minimumOrderPlatform: number };

export type EstimateDeliveryTimeQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
  customerLatitude: Scalars['Float']['input'];
  customerLongitude: Scalars['Float']['input'];
}>;


export type EstimateDeliveryTimeQuery = { __typename?: 'Query', estimatedDeliveryTime: number };

export type MeAppQueryVariables = Exact<{ [key: string]: never; }>;


export type MeAppQuery = { __typename?: 'Query', meApp: { __typename?: 'AppUser', id: string, name: string, email: string, phone: string, cpf?: string | null, role: UserRole, isDeliverer: boolean, pendingRole?: string | null, rejectedAt?: any | null, rejectionReason?: string | null, paymentConnected: boolean, acceptedTermsAt?: any | null, emailVerified: boolean, phoneVerified: boolean, avatarUrl?: string | null } };

export type ContractContentQueryVariables = Exact<{
  type: Scalars['String']['input'];
}>;


export type ContractContentQuery = { __typename?: 'Query', contractContent: string };

export type MyCardsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyCardsQuery = { __typename?: 'Query', myCards: Array<{ __typename?: 'SavedCard', id: string, lastFourDigits: string, brand: string, holderName: string, expMonth: number, expYear: number }> };

export type MyAddressesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyAddressesQuery = { __typename?: 'Query', myAddresses: Array<{ __typename?: 'Address', id: string, street: string, number: string, complement?: string | null, neighborhood: string, city: string, state: string, zipCode: string, latitude: number, longitude: number, isDefault: boolean }> };

export type PopularProductsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PopularProductsQuery = { __typename?: 'Query', popularProducts: Array<{ __typename?: 'PopularProduct', id: string, name: string, description?: string | null, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, storeId: string, storeName: string, storeLogoUrl?: string | null, storeIsOpen: boolean, categoryName?: string | null, totalSold: number }> };

export type ReorderSuggestionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ReorderSuggestionsQuery = { __typename?: 'Query', reorderSuggestions: Array<{ __typename?: 'ReorderProduct', id: string, name: string, description?: string | null, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, storeId: string, storeName: string, storeLogoUrl?: string | null, storeIsOpen: boolean, lastOrderedAt: any }> };

export type FrequentStoresQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type FrequentStoresQuery = { __typename?: 'Query', frequentStores: Array<{ __typename?: 'FrequentStore', id: string, name: string, description?: string | null, logoUrl?: string | null, bannerUrl?: string | null, isOpen: boolean, freeDelivery: boolean, deliveryFee: number, verificationLevel?: string | null, orderCount: number, lastOrderAt: any }> };

export type TopStoresWeeklyQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type TopStoresWeeklyQuery = { __typename?: 'Query', topStoresWeekly: Array<{ __typename?: 'WeeklyTopStore', id: string, name: string, description?: string | null, logoUrl?: string | null, isOpen: boolean, freeDelivery: boolean, deliveryFee: number, verificationLevel?: string | null, orderCount: number, totalRevenue: number }> };

export type FollowedStoresQueryVariables = Exact<{ [key: string]: never; }>;


export type FollowedStoresQuery = { __typename?: 'Query', followedStores: Array<{ __typename?: 'Store', id: string, name: string, description?: string | null, logoUrl?: string | null, bannerUrl?: string | null, isOpen: boolean, freeDelivery: boolean, deliveryFee: number, verificationLevel: VerificationLevel }> };

export type IsFollowingStoreQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type IsFollowingStoreQuery = { __typename?: 'Query', isFollowingStore: boolean };

export type FollowerCountQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type FollowerCountQuery = { __typename?: 'Query', followerCount: number };

export type SearchProductsQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchProductsQuery = { __typename?: 'Query', searchProducts: Array<{ __typename?: 'Product', id: string, name: string, description?: string | null, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null, isOpen: boolean }, category?: { __typename?: 'Category', id: string, name: string } | null }> };

export type SearchServicesQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchServicesQuery = { __typename?: 'Query', searchServices: Array<{ __typename?: 'Service', id: string, name: string, description?: string | null, price?: number | null, estimatedDuration: number, imageUrl?: string | null, isAvailable: boolean, requiresQuote: boolean, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null, isOpen: boolean }, category?: { __typename?: 'Category', id: string, name: string } | null }> };

export type AvailableDeliveriesQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableDeliveriesQuery = { __typename?: 'Query', availableDeliveries: Array<{ __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, deliveryFee: number, deliveryAddress?: string | null, createdAt: any, store: { __typename?: 'Store', id: string, name: string, street: string, number: string, neighborhood: string, city: string }, customer: { __typename?: 'AppUser', name: string, phone: string }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, product?: { __typename?: 'Product', name: string } | null }> }> };

export type MyDeliveriesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyDeliveriesQuery = { __typename?: 'Query', myDeliveries: Array<{ __typename?: 'Delivery', id: string, pickedUpAt?: any | null, deliveredAt?: any | null, createdAt: any, order: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, deliveryFee: number, deliveryAddress?: string | null, notes?: string | null, deliveryLatitude?: number | null, deliveryLongitude?: number | null, delivererConfirmedDeliveryAt?: any | null, customerConfirmedAt?: any | null, completedAt?: any | null, disputedAt?: any | null, disputeReason?: string | null, store: { __typename?: 'Store', name: string, street: string, number: string, neighborhood: string, city: string, phone: string, latitude: number, longitude: number }, customer: { __typename?: 'AppUser', name: string, phone: string }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, product?: { __typename?: 'Product', name: string } | null }> } }> };

export type MyBalanceQueryVariables = Exact<{ [key: string]: never; }>;


export type MyBalanceQuery = { __typename?: 'Query', myBalance: { __typename?: 'RecipientBalance', availableAmount: number, waitingFundsAmount: number, transferredAmount: number } };

export type SimulateAnticipationQueryVariables = Exact<{ [key: string]: never; }>;


export type SimulateAnticipationQuery = { __typename?: 'Query', simulateAnticipation: { __typename?: 'AnticipationSimulation', originalAmount: number, anticipatedAmount: number, fee: number, feePercentage: number } };

export type AvailableSlotsQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  date: Scalars['String']['input'];
}>;


export type AvailableSlotsQuery = { __typename?: 'Query', availableSlots: Array<string> };

export type MyAppointmentsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyAppointmentsQuery = { __typename?: 'Query', myAppointments: Array<{ __typename?: 'Appointment', id: string, appointmentNumber: string, scheduledDate: string, scheduledTime: string, endTime: string, status: AppointmentStatus, price?: number | null, notes?: string | null, address?: string | null, quoteDescription?: string | null, quoteResponse?: string | null, paymentMethod?: string | null, createdAt: any, customer: { __typename?: 'AppUser', id: string, name: string }, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null }, service: { __typename?: 'Service', id: string, name: string, description?: string | null, estimatedDuration: number, imageUrl?: string | null } }> };

export type AppointmentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AppointmentQuery = { __typename?: 'Query', appointment: { __typename?: 'Appointment', id: string, appointmentNumber: string, scheduledDate: string, scheduledTime: string, endTime: string, status: AppointmentStatus, price?: number | null, notes?: string | null, address?: string | null, latitude?: number | null, longitude?: number | null, quoteDescription?: string | null, quoteResponse?: string | null, paymentMethod?: string | null, paymentStatus?: string | null, checkoutUrl?: string | null, pixQrCode?: string | null, pixQrCodeBase64?: string | null, createdAt: any, customer: { __typename?: 'AppUser', id: string, name: string, phone: string }, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null }, service: { __typename?: 'Service', id: string, name: string, description?: string | null, estimatedDuration: number, imageUrl?: string | null, requiresQuote: boolean } } };

export type StoreScheduleQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type StoreScheduleQuery = { __typename?: 'Query', storeSchedule: Array<{ __typename?: 'Schedule', id: string, dayOfWeek: number, startTime: string, endTime: string, isActive: boolean }> };

export type RatingForAppointmentQueryVariables = Exact<{
  appointmentId: Scalars['String']['input'];
}>;


export type RatingForAppointmentQuery = { __typename?: 'Query', ratingForAppointment?: { __typename?: 'ServiceRating', id: string, rating: number, comment?: string | null, photoUrls?: Array<string> | null, createdAt: any } | null };

export type ServiceRatingsQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type ServiceRatingsQuery = { __typename?: 'Query', serviceRatings: Array<{ __typename?: 'ServiceRating', id: string, rating: number, comment?: string | null, photoUrls?: Array<string> | null, createdAt: any, customer: { __typename?: 'AppUser', id: string, name: string }, service: { __typename?: 'Service', id: string, name: string } }> };

export type AverageStoreRatingQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type AverageStoreRatingQuery = { __typename?: 'Query', averageStoreRating: number };

export type OrderUpdatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OrderUpdatedSubscription = { __typename?: 'Subscription', orderUpdated: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, subtotal: number, deliveryFee: number, deliveryAddress?: string | null, notes?: string | null, paymentMethod?: string | null, isPickup: boolean, customerConfirmedAt?: any | null, createdAt: any, store: { __typename?: 'Store', id: string, name: string, logoUrl?: string | null }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, unitPrice: number, totalPrice: number, product?: { __typename?: 'Product', id: string, name: string, imageUrl?: string | null } | null }>, delivery?: { __typename?: 'Delivery', id: string, currentLatitude?: number | null, currentLongitude?: number | null, pickedUpAt?: any | null, deliveredAt?: any | null, deliverer?: { __typename?: 'AppUser', id: string, name: string } | null } | null } };

export type OrderCreatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OrderCreatedSubscription = { __typename?: 'Subscription', orderCreated: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, createdAt: any, store: { __typename?: 'Store', id: string, name: string } } };

export type StoreUpdatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type StoreUpdatedSubscription = { __typename?: 'Subscription', storeUpdated: { __typename?: 'Store', id: string, name: string, isOpen: boolean, isActive: boolean, logoUrl?: string | null } };

export type ProductUpdatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProductUpdatedSubscription = { __typename?: 'Subscription', productUpdated: { __typename?: 'Product', id: string, name: string, price: number, promotionalPrice?: number | null, imageUrl?: string | null, isAvailable: boolean, stock: number, unit?: string | null } };

export type ProductDeletedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProductDeletedSubscription = { __typename?: 'Subscription', productDeleted: { __typename?: 'ProductDeletedPayload', id: string, storeId?: string | null } };

export type PromotionUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PromotionUpdatedSubscription = { __typename?: 'Subscription', promotionUpdated: { __typename?: 'Promotion', id: string, title: string, description?: string | null, imageUrl?: string | null, promotionalPrice: number, isActive: boolean, isPaid: boolean, startDate: any, endDate: any, store: { __typename?: 'Store', id: string, name: string }, product?: { __typename?: 'Product', id: string, name: string, imageUrl?: string | null } | null } };

export type DeliveryUpdatedSubscriptionVariables = Exact<{
  orderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeliveryUpdatedSubscription = { __typename?: 'Subscription', deliveryUpdated: { __typename?: 'Delivery', id: string, currentLatitude?: number | null, currentLongitude?: number | null, pickedUpAt?: any | null, deliveredAt?: any | null, order: { __typename?: 'Order', id: string, status: OrderStatus }, deliverer?: { __typename?: 'AppUser', id: string, name: string } | null } };

export type SessionKickedSubscriptionVariables = Exact<{
  userId: Scalars['String']['input'];
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type SessionKickedSubscription = { __typename?: 'Subscription', sessionKicked: { __typename?: 'SessionKickedPayload', userId: string, userType: string } };


export const RegisterAppDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterAppInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerApp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isDeliverer"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRole"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<RegisterAppMutation, RegisterAppMutationVariables>;
export const ValidateRegistrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidateRegistration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateRegistration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"cpf"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"emailError"}},{"kind":"Field","name":{"kind":"Name","value":"cpfError"}},{"kind":"Field","name":{"kind":"Name","value":"phoneError"}}]}}]}}]} as unknown as DocumentNode<ValidateRegistrationMutation, ValidateRegistrationMutationVariables>;
export const SendVerificationCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendVerificationCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendVerificationCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<SendVerificationCodeMutation, SendVerificationCodeMutationVariables>;
export const VerifyCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<VerifyCodeMutation, VerifyCodeMutationVariables>;
export const SendEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}]}]}}]} as unknown as DocumentNode<SendEmailVerificationMutation, SendEmailVerificationMutationVariables>;
export const ConfirmEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}]}]}}]} as unknown as DocumentNode<ConfirmEmailVerificationMutation, ConfirmEmailVerificationMutationVariables>;
export const LoginAppDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forceLogin"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginApp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"forceLogin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forceLogin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isDeliverer"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRole"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<LoginAppMutation, LoginAppMutationVariables>;
export const CreateOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"checkoutUrl"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCode"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCodeBase64"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateOrderMutation, CreateOrderMutationVariables>;
export const RegisterAsDelivererDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterAsDeliverer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterDelivererInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerAsDeliverer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isDeliverer"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRole"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleType"}},{"kind":"Field","name":{"kind":"Name","value":"vehiclePlate"}},{"kind":"Field","name":{"kind":"Name","value":"identityPhotoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"identityPhotoBackUrl"}},{"kind":"Field","name":{"kind":"Name","value":"profilePhotoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"cnhNumber"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}}]}}]}}]} as unknown as DocumentNode<RegisterAsDelivererMutation, RegisterAsDelivererMutationVariables>;
export const AcceptDeliveryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptDelivery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptDelivery"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}}]}}]}}]}}]} as unknown as DocumentNode<AcceptDeliveryMutation, AcceptDeliveryMutationVariables>;
export const ConfirmPickupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmPickup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deliveryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmPickup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deliveryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deliveryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pickedUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<ConfirmPickupMutation, ConfirmPickupMutationVariables>;
export const UploadImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"base64"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"base64"},"value":{"kind":"Variable","name":{"kind":"Name","value":"base64"}}},{"kind":"Argument","name":{"kind":"Name","value":"folder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folder"}}}]}]}}]} as unknown as DocumentNode<UploadImageMutation, UploadImageMutationVariables>;
export const ConfirmDeliveryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmDelivery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deliveryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmDelivery"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deliveryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deliveryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<ConfirmDeliveryMutation, ConfirmDeliveryMutationVariables>;
export const CreateAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"complement"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zipCode"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<CreateAddressMutation, CreateAddressMutationVariables>;
export const SetDefaultAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<SetDefaultAddressMutation, SetDefaultAddressMutationVariables>;
export const UpdateAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"complement"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zipCode"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpdateAddressMutation, UpdateAddressMutationVariables>;
export const DeleteAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAddressMutation, DeleteAddressMutationVariables>;
export const DisconnectPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisconnectPayment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnectPayment"}}]}}]} as unknown as DocumentNode<DisconnectPaymentMutation, DisconnectPaymentMutationVariables>;
export const SaveCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastFourDigits"}},{"kind":"Field","name":{"kind":"Name","value":"brand"}},{"kind":"Field","name":{"kind":"Name","value":"holderName"}},{"kind":"Field","name":{"kind":"Name","value":"expMonth"}},{"kind":"Field","name":{"kind":"Name","value":"expYear"}}]}}]}}]} as unknown as DocumentNode<SaveCardMutation, SaveCardMutationVariables>;
export const DeleteCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cardId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cardId"}}}]}]}}]} as unknown as DocumentNode<DeleteCardMutation, DeleteCardMutationVariables>;
export const FollowStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FollowStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<FollowStoreMutation, FollowStoreMutationVariables>;
export const UnfollowStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnfollowStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unfollowStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<UnfollowStoreMutation, UnfollowStoreMutationVariables>;
export const UpdateAppProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAppProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"avatarUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAppProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"avatarUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"avatarUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<UpdateAppProfileMutation, UpdateAppProfileMutationVariables>;
export const RegisterAppPushTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterAppPushToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerAppPushToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<RegisterAppPushTokenMutation, RegisterAppPushTokenMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const AcceptAppTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptAppTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptAppTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}}]}}]}}]} as unknown as DocumentNode<AcceptAppTermsMutation, AcceptAppTermsMutationVariables>;
export const ConfirmReceiptDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmReceipt"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmReceipt"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"customerConfirmedAt"}}]}}]}}]} as unknown as DocumentNode<ConfirmReceiptMutation, ConfirmReceiptMutationVariables>;
export const RequestPasswordResetAppDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordResetApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordResetApp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestPasswordResetAppMutation, RequestPasswordResetAppMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"StringValue","value":"app","block":false}}]}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const GoogleAuthAppDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GoogleAuthApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleAuthApp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"idToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isDeliverer"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRole"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<GoogleAuthAppMutation, GoogleAuthAppMutationVariables>;
export const AddToCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddToCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddToCartInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addToCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AddToCartMutation, AddToCartMutationVariables>;
export const UpdateCartItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCartItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCartItemInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCartItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}}]}}]}}]} as unknown as DocumentNode<UpdateCartItemMutation, UpdateCartItemMutationVariables>;
export const RemoveFromCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveFromCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cartItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeFromCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cartItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cartItemId"}}}]}]}}]} as unknown as DocumentNode<RemoveFromCartMutation, RemoveFromCartMutationVariables>;
export const ClearCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearCart"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCart"}}]}}]} as unknown as DocumentNode<ClearCartMutation, ClearCartMutationVariables>;
export const ClearCartByStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearCartByStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCartByStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<ClearCartByStoreMutation, ClearCartByStoreMutationVariables>;
export const ValidateFacePhotoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidateFacePhoto"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateFacePhoto"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ValidateFacePhotoMutation, ValidateFacePhotoMutationVariables>;
export const ValidateDocumentPhotoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidateDocumentPhoto"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateDocumentPhoto"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ValidateDocumentPhotoMutation, ValidateDocumentPhotoMutationVariables>;
export const RegisterRecipientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterRecipient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recipientData"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerRecipient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"recipientData"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recipientData"}}}]}]}}]} as unknown as DocumentNode<RegisterRecipientMutation, RegisterRecipientMutationVariables>;
export const RequestAnticipationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"requestedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"fee"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<RequestAnticipationMutation, RequestAnticipationMutationVariables>;
export const ToggleAutoAnticipationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleAutoAnticipation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutoAnticipation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}]}]}}]} as unknown as DocumentNode<ToggleAutoAnticipationMutation, ToggleAutoAnticipationMutationVariables>;
export const CustomerDenyDeliveryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CustomerDenyDelivery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customerDenyDelivery"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CustomerDenyDeliveryMutation, CustomerDenyDeliveryMutationVariables>;
export const DisputeCompletedOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisputeCompletedOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disputeCompletedOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DisputeCompletedOrderMutation, DisputeCompletedOrderMutationVariables>;
export const CancelDisputeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelDispute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelDispute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelDisputeMutation, CancelDisputeMutationVariables>;
export const CancelOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelOrderMutation, CancelOrderMutationVariables>;
export const RegisterAppWithGoogleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterAppWithGoogle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerAppWithGoogle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"idToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"cpf"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isDeliverer"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRole"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<RegisterAppWithGoogleMutation, RegisterAppWithGoogleMutationVariables>;
export const CreateAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAppointmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"checkoutUrl"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCode"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCodeBase64"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAppointmentMutation, CreateAppointmentMutationVariables>;
export const CancelAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelAppointmentMutation, CancelAppointmentMutationVariables>;
export const RequestQuoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestQuote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestQuoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestQuote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quoteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<RequestQuoteMutation, RequestQuoteMutationVariables>;
export const AcceptQuoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptQuote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scheduledDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scheduledTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptQuote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"scheduledDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scheduledDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"scheduledTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scheduledTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTime"}}]}}]}}]} as unknown as DocumentNode<AcceptQuoteMutation, AcceptQuoteMutationVariables>;
export const RejectQuoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectQuote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectQuote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RejectQuoteMutation, RejectQuoteMutationVariables>;
export const RateServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RateService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateServiceRatingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rateService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<RateServiceMutation, RateServiceMutationVariables>;
export const StoresDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Stores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"hasOwnDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDeliveryAbove"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"verificationScore"}},{"kind":"Field","name":{"kind":"Name","value":"storeType"}}]}}]}}]} as unknown as DocumentNode<StoresQuery, StoresQueryVariables>;
export const NearbyStoresDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NearbyStores"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"radiusKm"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nearbyStores"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"latitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"longitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"radiusKm"},"value":{"kind":"Variable","name":{"kind":"Name","value":"radiusKm"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"hasOwnDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDeliveryAbove"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"verificationScore"}}]}}]}}]} as unknown as DocumentNode<NearbyStoresQuery, NearbyStoresQueryVariables>;
export const DeliveryPricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeliveryPricing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveryBasePrice"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryPricePerKm"}}]}}]} as unknown as DocumentNode<DeliveryPricingQuery, DeliveryPricingQueryVariables>;
export const StoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Store"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"store"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"hasOwnDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"ownerPaymentConnected"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDeliveryAbove"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"verificationScore"}},{"kind":"Field","name":{"kind":"Name","value":"storeType"}},{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requiresAgeVerification"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQuote"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requiresAgeVerification"}}]}}]}}]}}]} as unknown as DocumentNode<StoreQuery, StoreQueryVariables>;
export const MyCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCart"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCart"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<MyCartQuery, MyCartQueryVariables>;
export const MyCartByStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCartByStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCartByStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<MyCartByStoreQuery, MyCartByStoreQueryVariables>;
export const MyOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"customerConfirmedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"delivery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}}]}}]}}]}}]} as unknown as DocumentNode<MyOrdersQuery, MyOrdersQueryVariables>;
export const OrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Order"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"checkoutUrl"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCode"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCodeBase64"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}},{"kind":"Field","name":{"kind":"Name","value":"customerConfirmedAt"}},{"kind":"Field","name":{"kind":"Name","value":"vendorConfirmedPickupAt"}},{"kind":"Field","name":{"kind":"Name","value":"delivererConfirmedDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"disputedAt"}},{"kind":"Field","name":{"kind":"Name","value":"disputeReason"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryEta"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"delivery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"currentLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliverer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"profilePhotoUrl"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrderQuery, OrderQueryVariables>;
export const ActivePromotionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivePromotions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activePromotions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}}]}}]}}]}}]} as unknown as DocumentNode<ActivePromotionsQuery, ActivePromotionsQueryVariables>;
export const CalculateDeliveryFeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateDeliveryFee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customerLatitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customerLongitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculateDeliveryFee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"customerLatitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customerLatitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"customerLongitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customerLongitude"}}}]}]}}]} as unknown as DocumentNode<CalculateDeliveryFeeQuery, CalculateDeliveryFeeQueryVariables>;
export const MinimumOrderPlatformDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MinimumOrderPlatform"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimumOrderPlatform"}}]}}]} as unknown as DocumentNode<MinimumOrderPlatformQuery, MinimumOrderPlatformQueryVariables>;
export const EstimateDeliveryTimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EstimateDeliveryTime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customerLatitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customerLongitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryTime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"customerLatitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customerLatitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"customerLongitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customerLongitude"}}}]}]}}]} as unknown as DocumentNode<EstimateDeliveryTimeQuery, EstimateDeliveryTimeQueryVariables>;
export const MeAppDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MeApp"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meApp"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isDeliverer"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRole"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"paymentConnected"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<MeAppQuery, MeAppQueryVariables>;
export const ContractContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContractContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contractContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}]}]}}]} as unknown as DocumentNode<ContractContentQuery, ContractContentQueryVariables>;
export const MyCardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastFourDigits"}},{"kind":"Field","name":{"kind":"Name","value":"brand"}},{"kind":"Field","name":{"kind":"Name","value":"holderName"}},{"kind":"Field","name":{"kind":"Name","value":"expMonth"}},{"kind":"Field","name":{"kind":"Name","value":"expYear"}}]}}]}}]} as unknown as DocumentNode<MyCardsQuery, MyCardsQueryVariables>;
export const MyAddressesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyAddresses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myAddresses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"complement"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zipCode"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<MyAddressesQuery, MyAddressesQueryVariables>;
export const PopularProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PopularProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popularProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"storeId"}},{"kind":"Field","name":{"kind":"Name","value":"storeName"}},{"kind":"Field","name":{"kind":"Name","value":"storeLogoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"storeIsOpen"}},{"kind":"Field","name":{"kind":"Name","value":"categoryName"}},{"kind":"Field","name":{"kind":"Name","value":"totalSold"}}]}}]}}]} as unknown as DocumentNode<PopularProductsQuery, PopularProductsQueryVariables>;
export const ReorderSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReorderSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"storeId"}},{"kind":"Field","name":{"kind":"Name","value":"storeName"}},{"kind":"Field","name":{"kind":"Name","value":"storeLogoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"storeIsOpen"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrderedAt"}}]}}]}}]} as unknown as DocumentNode<ReorderSuggestionsQuery, ReorderSuggestionsQueryVariables>;
export const FrequentStoresDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FrequentStores"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"frequentStores"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"orderCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrderAt"}}]}}]}}]} as unknown as DocumentNode<FrequentStoresQuery, FrequentStoresQueryVariables>;
export const TopStoresWeeklyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TopStoresWeekly"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topStoresWeekly"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"orderCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}}]}}]}}]} as unknown as DocumentNode<TopStoresWeeklyQuery, TopStoresWeeklyQueryVariables>;
export const FollowedStoresDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FollowedStores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followedStores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}}]}}]}}]} as unknown as DocumentNode<FollowedStoresQuery, FollowedStoresQueryVariables>;
export const IsFollowingStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsFollowingStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isFollowingStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<IsFollowingStoreQuery, IsFollowingStoreQueryVariables>;
export const FollowerCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FollowerCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followerCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<FollowerCountQuery, FollowerCountQueryVariables>;
export const SearchProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}}]}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SearchProductsQuery, SearchProductsQueryVariables>;
export const SearchServicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchServices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchServices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQuote"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}}]}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SearchServicesQuery, SearchServicesQueryVariables>;
export const AvailableDeliveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableDeliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableDeliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AvailableDeliveriesQuery, AvailableDeliveriesQueryVariables>;
export const MyDeliveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyDeliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDeliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pickedUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"delivererConfirmedDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"customerConfirmedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"disputedAt"}},{"kind":"Field","name":{"kind":"Name","value":"disputeReason"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MyDeliveriesQuery, MyDeliveriesQueryVariables>;
export const MyBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyBalance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myBalance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableAmount"}},{"kind":"Field","name":{"kind":"Name","value":"waitingFundsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"transferredAmount"}}]}}]}}]} as unknown as DocumentNode<MyBalanceQuery, MyBalanceQueryVariables>;
export const SimulateAnticipationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SimulateAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulateAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"originalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"anticipatedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"fee"}},{"kind":"Field","name":{"kind":"Name","value":"feePercentage"}}]}}]}}]} as unknown as DocumentNode<SimulateAnticipationQuery, SimulateAnticipationQueryVariables>;
export const AvailableSlotsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableSlots"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableSlots"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}}]}]}}]} as unknown as DocumentNode<AvailableSlotsQuery, AvailableSlotsQueryVariables>;
export const MyAppointmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyAppointments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myAppointments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"quoteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"quoteResponse"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<MyAppointmentsQuery, MyAppointmentsQueryVariables>;
export const AppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Appointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"quoteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"quoteResponse"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"checkoutUrl"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCode"}},{"kind":"Field","name":{"kind":"Name","value":"pixQrCodeBase64"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQuote"}}]}}]}}]}}]} as unknown as DocumentNode<AppointmentQuery, AppointmentQueryVariables>;
export const StoreScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<StoreScheduleQuery, StoreScheduleQueryVariables>;
export const RatingForAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RatingForAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appointmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ratingForAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appointmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appointmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrls"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<RatingForAppointmentQuery, RatingForAppointmentQueryVariables>;
export const ServiceRatingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServiceRatings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceRatings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrls"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ServiceRatingsQuery, ServiceRatingsQueryVariables>;
export const AverageStoreRatingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AverageStoreRating"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"averageStoreRating"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<AverageStoreRatingQuery, AverageStoreRatingQueryVariables>;
export const OrderUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OrderUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"isPickup"}},{"kind":"Field","name":{"kind":"Name","value":"customerConfirmedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"delivery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"currentLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"pickedUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliverer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrderUpdatedSubscription, OrderUpdatedSubscriptionVariables>;
export const OrderCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OrderCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<OrderCreatedSubscription, OrderCreatedSubscriptionVariables>;
export const StoreUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"StoreUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}}]}}]} as unknown as DocumentNode<StoreUpdatedSubscription, StoreUpdatedSubscriptionVariables>;
export const ProductUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ProductUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]} as unknown as DocumentNode<ProductUpdatedSubscription, ProductUpdatedSubscriptionVariables>;
export const ProductDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ProductDeleted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productDeleted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"storeId"}}]}}]}}]} as unknown as DocumentNode<ProductDeletedSubscription, ProductDeletedSubscriptionVariables>;
export const PromotionUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PromotionUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"promotionUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPaid"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<PromotionUpdatedSubscription, PromotionUpdatedSubscriptionVariables>;
export const DeliveryUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeliveryUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveryUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"currentLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"pickedUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deliverer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<DeliveryUpdatedSubscription, DeliveryUpdatedSubscriptionVariables>;
export const SessionKickedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SessionKicked"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionKicked"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userType"}}]}}]}}]} as unknown as DocumentNode<SessionKickedSubscription, SessionKickedSubscriptionVariables>;