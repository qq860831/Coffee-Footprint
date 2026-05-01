export type CoffeeShopStatus = 'visited' | 'want_to_go';

export interface CoffeeShop {
  id: string;
  name: string;
  city: string;
  district: string;
  rating: number; // 0 to 5
  tags: string[];
  highlights: string;
  status: CoffeeShopStatus;
  isFavorite?: boolean;
  createdAt: number;
}
