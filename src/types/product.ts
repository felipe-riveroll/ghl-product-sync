export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  priceId: string;
}

export interface ProductUpdateRequest {
  productId: string;
  priceId: string;
  price: number;
}

export interface InventoryUpdateRequest {
  productId: string;
  quantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}