import { ShoppingCart, Pill, Shirt, Smartphone, UtensilsCrossed, Sparkles, Sofa, Store } from 'lucide-react';

export const CATEGORIES = [
  { value: 'GROCERY', label: 'Grocery', icon: ShoppingCart, bg: 'bg-green-50', color: 'text-green-600' },
  { value: 'PHARMACY', label: 'Pharmacy', icon: Pill, bg: 'bg-red-50', color: 'text-red-600' },
  { value: 'FASHION', label: 'Fashion', icon: Shirt, bg: 'bg-pink-50', color: 'text-pink-600' },
  { value: 'ELECTRONICS', label: 'Electronics', icon: Smartphone, bg: 'bg-blue-50', color: 'text-blue-600' },
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed, bg: 'bg-orange-50', color: 'text-orange-600' },
  { value: 'BEAUTY', label: 'Beauty', icon: Sparkles, bg: 'bg-purple-50', color: 'text-purple-600' },
  { value: 'HOME_GOODS', label: 'Home', icon: Sofa, bg: 'bg-amber-50', color: 'text-amber-600' },
  { value: 'OTHER', label: 'Other', icon: Store, bg: 'bg-gray-100', color: 'text-gray-600' },
];

export const CATEGORY_ICON = Object.fromEntries(CATEGORIES.map(c => [c.value, c.icon]));
export const CATEGORY_BG = Object.fromEntries(CATEGORIES.map(c => [c.value, c.bg]));
export const CATEGORY_COLOR = Object.fromEntries(CATEGORIES.map(c => [c.value, c.color]));
