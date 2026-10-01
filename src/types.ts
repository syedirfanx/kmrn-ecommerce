export interface CategoryData {
  id: string;
  name: string;
  subcategories: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  description: string;
  details: string;
  specs: { label: string; value: string }[];
  image: string;
  additionalImages?: string[];
  inStock: boolean;
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

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderConfirmation {
  orderId: string;
  customerName: string;
  email: string;
  shippingAddress: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  placedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
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
