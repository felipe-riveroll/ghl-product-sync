import { Product, ProductUpdateRequest, InventoryUpdateRequest, ApiResponse } from '@/types/product';

// Simulated data - replace with real GoHighLevel API calls
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Producto Premium A',
    price: 299.99,
    quantity: 15,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop&crop=center',
    priceId: 'price_1'
  },
  {
    id: '2',
    name: 'Producto Estándar B',
    price: 149.99,
    quantity: 32,
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
    priceId: 'price_2'
  },
  {
    id: '3',
    name: 'Producto Básico C',
    price: 79.99,
    quantity: 8,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center',
    priceId: 'price_3'
  },
  {
    id: '4',
    name: 'Producto Deluxe D',
    price: 449.99,
    quantity: 5,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center',
    priceId: 'price_4'
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  // GET /products - Fetch all products
  async getProducts(): Promise<ApiResponse<Product[]>> {
    await delay(800); // Simulate network delay
    
    try {
      // Here you would integrate with @gohighlevel/api-client
      // const client = new GHLClient({ accessToken: process.env.GHL_ACCESS_TOKEN });
      // const products = await client.products.list();
      
      return {
        success: true,
        data: mockProducts,
        message: 'Products loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Error loading products'
      };
    }
  },

  // PUT /products/:productId/price/:priceId - Update product price
  async updateProductPrice({ productId, priceId, price }: ProductUpdateRequest): Promise<ApiResponse<Product>> {
    await delay(500);
    
    try {
      // Here you would call the real API
      // const client = new GHLClient({ accessToken: process.env.GHL_ACCESS_TOKEN });
      // const result = await client.products.updatePrice(productId, priceId, { price });
      
      const productIndex = mockProducts.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        throw new Error('Product not found');
      }
      
      mockProducts[productIndex].price = price;
      
      return {
        success: true,
        data: mockProducts[productIndex],
        message: 'Price updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {} as Product,
        message: 'Error updating price'
      };
    }
  },

  // POST /products/inventory - Update product inventory
  async updateInventory({ productId, quantity }: InventoryUpdateRequest): Promise<ApiResponse<Product>> {
    await delay(500);
    
    try {
      // Here you would call the real API
      // const client = new GHLClient({ accessToken: process.env.GHL_ACCESS_TOKEN });
      // const result = await client.products.updateInventory({ productId, quantity });
      
      const productIndex = mockProducts.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        throw new Error('Product not found');
      }
      
      mockProducts[productIndex].quantity = quantity;
      
      return {
        success: true,
        data: mockProducts[productIndex],
        message: 'Inventory updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {} as Product,
        message: 'Error updating inventory'
      };
    }
  }
};