export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  rate: number; // relative to USD (USD = 1.0)
}

export interface ProductColor {
  name: string;
  hex: string;
}

export type ProductCategory =
  | 'Dresses'
  | 'Co-ords'
  | 'Kurtas & Tunics'
  | 'Kaftans'
  | 'Bedsheets'
  | 'Home'
  | 'Gifts'
  | 'Sale';

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  price: number; // in USD
  originalPrice?: number;
  image: string;
  secondaryImage?: string;
  colors: ProductColor[];
  sizes: string[];
  stockPerSize: Record<string, number>;
  description: string;
  fabric: string;
  craftTechnique: string;
  careInstructions: string;
  fitNote: string;
  rating: number;
  reviewsCount: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  onSale?: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  addresses?: CustomerDetails[];
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = 'card' | 'upi' | 'applepay' | 'netbanking' | 'cod';

export interface OrderConfirmationData {
  orderId: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  currency: Currency;
  date: string;
  estimatedDelivery: string;
}

export interface FilterOptions {
  category: string;
  minPrice: number;
  maxPrice: number;
  fabrics: string[];
  sizes: string[];
  colors: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
}
