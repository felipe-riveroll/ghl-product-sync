import {
  Product,
  ProductUpdateRequest,
  InventoryUpdateRequest,
  ApiResponse,
  PaginationInfo,
  ProductsSummary,
} from '@/types/product';

// API base URL for the backend server
const API_BASE_URL = 'http://localhost:3001/api';

const toMaybeNumber = (value: unknown): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const buildPagination = (
  overrides: Partial<PaginationInfo>,
  fallback: { page: number; limit: number; total: number }
): PaginationInfo => {
  const computedTotalPages =
    overrides.totalPages ??
    (fallback.total > 0 ? Math.ceil(fallback.total / fallback.limit) : 1);

  const totalPages = Math.max(1, computedTotalPages);

  return {
    page: overrides.page ?? fallback.page,
    limit: overrides.limit ?? fallback.limit,
    total: overrides.total ?? fallback.total,
    totalPages,
    hasNext:
      overrides.hasNext ??
      (totalPages > 0 ? (overrides.page ?? fallback.page) < totalPages : false),
    hasPrevious: overrides.hasPrevious ?? (overrides.page ?? fallback.page) > 1,
  };
};

const buildSummary = (products: Product[], overrides?: Partial<ProductsSummary>): ProductsSummary => {
  const fallbackSummary: ProductsSummary = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0),
    totalStock: products.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
  };

  return {
    totalProducts: overrides?.totalProducts ?? fallbackSummary.totalProducts,
    totalValue: overrides?.totalValue ?? fallbackSummary.totalValue,
    totalStock: overrides?.totalStock ?? fallbackSummary.totalStock,
  };
};

export const productService = {
  // GET /products - Fetch all products with pagination and filtering
  async getProducts(
    page: number = 1,
    limit: number = 20,
    filters: {
      search?: string;
      minPrice?: number | string;
      maxPrice?: number | string;
      minQuantity?: number | string;
      maxQuantity?: number | string;
    } = {}
  ): Promise<
    ApiResponse<{ products: Product[]; pagination: PaginationInfo; summary: ProductsSummary }>
  > {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      // Append filter parameters if they are provided and not empty
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters.minQuantity) params.append('minQuantity', String(filters.minQuantity));
      if (filters.maxQuantity) params.append('maxQuantity', String(filters.maxQuantity));
      
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      const products: Product[] = Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
          ? data
          : [];

      const pagination = buildPagination(
        {
          page: toMaybeNumber(data?.pagination?.page),
          limit: toMaybeNumber(data?.pagination?.limit),
          total: toMaybeNumber(data?.pagination?.total),
          totalPages: toMaybeNumber(data?.pagination?.totalPages),
          hasNext: typeof data?.pagination?.hasNext === 'boolean' ? data.pagination.hasNext : undefined,
          hasPrevious:
            typeof data?.pagination?.hasPrevious === 'boolean'
              ? data.pagination.hasPrevious
              : undefined,
        },
        {
          page,
          limit,
          total: Array.isArray(data?.products)
            ? toMaybeNumber(data?.pagination?.total) ?? products.length
            : products.length,
        }
      );
      
      const summary = buildSummary(products, {
        totalProducts: toMaybeNumber(data?.summary?.totalProducts),
        totalValue: toMaybeNumber(data?.summary?.totalValue),
        totalStock: toMaybeNumber(data?.summary?.totalStock),
      });

      return {
        success: true,
        data: { products, pagination, summary },
        message: 'Products loaded successfully'
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        data: {
          products: [],
          pagination: buildPagination({}, { page, limit, total: 0 }),
          summary: {
            totalProducts: 0,
            totalValue: 0,
            totalStock: 0,
          },
        },
        message: `Error loading products: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  // PUT /products/:productId/price/:priceId - Update product price
  async updateProductPrice({ productId, priceId, price }: ProductUpdateRequest): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/price/${priceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update price');
      }
      
      // Return a minimal product object with updated price
      // In a real scenario, you might want to fetch the full product data
      return {
        success: true,
        data: {
          id: productId,
          priceId: result.priceId,
          price: result.price,
        } as Product,
        message: 'Price updated successfully'
      };
    } catch (error) {
      console.error('Error updating price:', error);
      return {
        success: false,
        data: {} as Product,
        message: `Error updating price: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  // POST /products/inventory - Update product inventory
  async updateInventory({ productId, quantity }: InventoryUpdateRequest): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update inventory');
      }
      
      // Return a minimal product object with updated quantity
      return {
        success: true,
        data: {
          id: result.productId,
          quantity: result.quantity,
        } as Product,
        message: 'Inventory updated successfully'
      };
    } catch (error) {
      console.error('Error updating inventory:', error);
      return {
        success: false,
        data: {} as Product,
        message: `Error updating inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};