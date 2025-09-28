export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string; // Made optional since backend doesn't provide this
  priceId: string;
  description?: string;
  category?: string;
  currency?: string;
  trackInventory?: boolean;
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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProductsSummary {
  totalProducts: number;
  totalValue: number;
  totalStock: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}