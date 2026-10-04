export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  order?: number;
  locked?: boolean;
}

export interface Catalogue {
  id: string;
  name: string;
  description?: string;
  image: string;
  category: string;
  order?: number;
  itemCount?: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  catalogueId?: string;
  catalogueName?: string;
  availableColours?: string[];
  availableSizes?: string[];
  selectedColour?: string;
  selectedSize?: string;
  price: number;
  description: string;
  details?: string;
  specs: { label: string; value: string }[];
  image: string;
  additionalImages?: string[];
  inStock: boolean;
  archived?: boolean;
  featured?: boolean;
  order?: number;
  rating: number;
  reviewsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerSlide {
  id: string;
  type: 'product' | 'custom';
  productId?: string;
  title?: string;
  subtitle?: string;
  image: string;
  buttonText?: string;
  linkUrl?: string;
  hasLinkOverBanner?: boolean;
  noLinkOverBanner?: boolean;
  hideButton?: boolean;
  order?: number;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  active: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColour?: string;
  selectedSize?: string;
}

export interface OrderConfirmation {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  shippingAddress: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discountAmount?: number;
  promoCode?: string;
  total: number;
  status: 'Processing' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Cash on Delivery';
  userId?: string;
  isGuest?: boolean;
  customerType?: 'Registered Account' | 'Guest Checkout';
  placedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  street?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StoreSettings {
  logoUrl?: string;
  brandName?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  read?: boolean;
}
