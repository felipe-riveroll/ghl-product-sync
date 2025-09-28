import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Redis Client Setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// GoHighLevel API configuration
const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_TOKEN = process.env.GHL_PERSONAL_INTEGRATION_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Validate required environment variables
if (!GHL_API_TOKEN) {
  console.error('Error: GHL_PERSONAL_INTEGRATION_TOKEN is required in .env file');
  process.exit(1);
}

if (!GHL_LOCATION_ID) {
  console.error('Error: GHL_LOCATION_ID is required in .env file');
  process.exit(1);
}

console.log('GHL API Token:', GHL_API_TOKEN ? 'Configured' : 'Missing');
console.log('GHL Location ID:', GHL_LOCATION_ID || 'Missing');


// Helper function to make GHL API calls
async function ghlApiCall(endpoint, options = {}) {
  const url = `${GHL_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

  const defaultHeaders = {
    'Authorization': `Bearer ${GHL_API_TOKEN}`,
    'Content-Type': 'application/json',
    'version': '2021-04-15', // Required version header for GHL API v2
  };

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
    signal: controller.signal,
  };

  console.log(`Making GHL API call to: ${endpoint}`);
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GHL API Error (${response.status}):`, errorText);
      throw new Error(`GHL API Error: ${response.status} - ${errorText}`);
    }

    // Check for empty response body
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('GHL API Call timed out.');
      throw new Error('Request to GHL API timed out.');
    }
    console.error('GHL API Call failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper function to fetch ALL products from GHL, handling pagination manually
async function getAllGhlProducts() {
  let allProducts = [];
  const limit = 100;
  let offset = 0;
  let total = 0;

  // First call to get the total number of products
  try {
    console.log(`Fetching initial product batch to get total...`);
    const initialResponse = await ghlApiCall(`/products/?locationId=${GHL_LOCATION_ID}&limit=${limit}&offset=${offset}`);
    const initialProducts = initialResponse.products || [];
    allProducts = allProducts.concat(initialProducts);

    // GHL API returns total in a nested array for some reason
    total = initialResponse.total?.[0]?.total ?? 0;

    if (total === 0 && initialProducts.length > 0) {
        // Fallback if total is not returned as expected
        total = initialProducts.length;
        console.warn("Total not found in initial response, proceeding with fetched count.");
    }

    console.log(`Total products reported by API: ${total}`);

    offset += initialProducts.length;

    // Fetch remaining pages
    while (offset < total) {
      console.log(`Fetching products... Offset: ${offset}, Limit: ${limit}`);
      const response = await ghlApiCall(`/products/?locationId=${GHL_LOCATION_ID}&limit=${limit}&offset=${offset}`);
      const products = response.products || [];

      if (products.length === 0) {
        // No more products to fetch, break the loop
        break;
      }

      allProducts = allProducts.concat(products);
      offset += products.length;
    }

  } catch (error) {
    console.error('Error during manual pagination for products:', error);
    // Return whatever was fetched before the error
  }

  console.log(`Successfully fetched a total of ${allProducts.length} products from GHL.`);
  return allProducts;
}

// Routes

// GET /api/products - Get all products with pricing information
app.get('/api/products', async (req, res) => {
  try {
    const cacheKey = 'products:all';
    let productsWithPricing;

    // 1. Check Redis Cache
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log('Cache hit! Serving from Redis.');
      productsWithPricing = JSON.parse(cachedData);
    } else {
      console.log('Cache miss! Fetching from GoHighLevel API...');
      // If not in cache, fetch from API
      const allProducts = await getAllGhlProducts();

      const fetchedProducts = [];
      for (const product of allProducts) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const pricesResponse = await ghlApiCall(`/products/${product._id}/price/?locationId=${GHL_LOCATION_ID}`);
          const prices = pricesResponse.prices || [];
          const firstPrice = prices.length > 0 ? prices[0] : null;
          
          fetchedProducts.push({
            id: product._id, name: product.name, description: product.description || '',
            category: product.productType || 'General', price: firstPrice ? firstPrice.amount : 0,
            priceId: firstPrice ? firstPrice._id : null, currency: firstPrice ? firstPrice.currency : 'MXN',
            quantity: firstPrice ? (firstPrice.availableQuantity || 0) : 0,
            trackInventory: firstPrice ? (firstPrice.trackInventory || false) : false,
            image: product.image || null
          });
        } catch (error) {
          console.error(`Error fetching price for product ${product._id}:`, error.message);
          fetchedProducts.push({
            id: product._id, name: product.name, description: product.description || '',
            category: product.productType || 'General', price: 0, priceId: null,
            currency: 'MXN', quantity: 0, trackInventory: false, image: product.image || null
          });
        }
      }
      productsWithPricing = fetchedProducts;
      // Store in Redis for 1 hour
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(productsWithPricing));
    }

    const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

    // Filter parameters
    const { search, minPrice, maxPrice, minQuantity, maxQuantity } = req.query;

    const page = Number.parseInt(pageParam ?? '1', 10);
    const limit = Number.parseInt(limitParam ?? '20', 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 300) : 20;
    const offset = (safePage - 1) * safeLimit;

    // 1. Get ALL products from GoHighLevel
    const allProducts = await getAllGhlProducts();

    // 2. Fetch prices sequentially with a delay to guarantee we don't hit rate limits.
    const productsWithPricing = [];
    for (const product of allProducts) {
      try {
        // Add a delay to avoid rate-limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        const pricesResponse = await ghlApiCall(`/products/${product._id}/price/?locationId=${GHL_LOCATION_ID}`);
        const prices = pricesResponse.prices || [];
        const firstPrice = prices.length > 0 ? prices[0] : null;

        productsWithPricing.push({
          id: product._id,
          name: product.name,
          description: product.description || '',
          category: product.productType || 'General',
              price: firstPrice ? firstPrice.amount : 0,
          priceId: firstPrice ? firstPrice._id : null,
          currency: firstPrice ? firstPrice.currency : 'MXN',
          quantity: firstPrice ? (firstPrice.availableQuantity || 0) : 0,
          trackInventory: firstPrice ? (firstPrice.trackInventory || false) : false,
          image: product.image || null
        });
      } catch (error) {
        console.error(`Error fetching price for product ${product._id}:`, error.message);
        productsWithPricing.push({
          id: product._id, name: product.name, description: product.description || '',
          category: product.productType || 'General', price: 0, priceId: null,
          currency: 'MXN', quantity: 0, trackInventory: false, image: product.image || null
        });
      }
    }

    // Apply filters
    let filteredProducts = productsWithPricing;

    // 1. Filter by search term (name)
    if (search && typeof search === 'string') {
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 2. Filter by price range
    const numMinPrice = minPrice ? parseFloat(minPrice) : null;
    const numMaxPrice = maxPrice ? parseFloat(maxPrice) : null;
    if (numMinPrice !== null) {
      filteredProducts = filteredProducts.filter(p => p.price >= numMinPrice);
    }
    if (numMaxPrice !== null) {
      filteredProducts = filteredProducts.filter(p => p.price <= numMaxPrice);
    }

    // 3. Filter by quantity range
    const numMinQuantity = minQuantity ? parseInt(minQuantity, 10) : null;
    const numMaxQuantity = maxQuantity ? parseInt(maxQuantity, 10) : null;
    if (numMinQuantity !== null) {
      filteredProducts = filteredProducts.filter(p => p.quantity >= numMinQuantity);
    }
    if (numMaxQuantity !== null) {
      filteredProducts = filteredProducts.filter(p => p.quantity <= numMaxQuantity);
    }

  const total = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice(offset, offset + safeLimit);
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;
    const hasNext = offset + paginatedProducts.length < total;

    // The summary should reflect ALL products, not just the filtered ones.
    // This provides a consistent overview of the entire inventory.
    const summary = productsWithPricing.reduce(
      (acc, product) => {
        const value = (product.price || 0) * (product.quantity || 0);
        return {
          totalProducts: acc.totalProducts + 1,
          totalValue: acc.totalValue + value,
          totalStock: acc.totalStock + (product.quantity || 0),
        };
      },
      { totalProducts: 0, totalValue: 0, totalStock: 0 }
    );

    console.log(
      `Successfully fetched ${paginatedProducts.length} products (page ${safePage}/${totalPages})`
    );

    // Return paginated response with metadata
    res.json({
      products: paginatedProducts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext,
        hasPrevious: safePage > 1,
      },
      summary,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products from GoHighLevel',
      message: error.message 
    });
  }
});

// PUT /api/products/:productId/price/:priceId - Update product price
app.put('/api/products/:productId/price/:priceId', async (req, res) => {
  try {
    const { productId, priceId } = req.params;
    const { price } = req.body;
    
    if (!price || isNaN(price)) {
      return res.status(400).json({ 
        error: 'Invalid price value' 
      });
    }
    
    console.log(`Updating price for product ${productId}, price ${priceId} to ${price}`);
    
    // Price is sent directly without conversion
    const priceAmount = parseFloat(price);
    
    // Update price via GoHighLevel API
    const updatedPrice = await ghlApiCall(`/products/${productId}/price/${priceId}?locationId=${GHL_LOCATION_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: priceAmount,
        currency: 'MXN'
      })
    });
    
    res.json({
      success: true,
      price: updatedPrice.amount, // Price is returned directly
      priceId: updatedPrice._id
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ 
      error: 'Failed to update price in GoHighLevel',
      message: error.message 
    });
  }
});

// POST /api/products/inventory - Update product inventory
app.post('/api/products/inventory', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({ 
        error: 'Invalid productId or quantity' 
      });
    }
    
    console.log(`Updating inventory for product ${productId} to quantity ${quantity}`);
    
    // First, get the current prices for the product to find the priceId
    const pricesResponse = await ghlApiCall(`/products/${productId}/price/?locationId=${GHL_LOCATION_ID}`);
    const prices = pricesResponse.prices || [];
    
    if (prices.length === 0) {
      return res.status(404).json({
        error: 'No prices found for product. Cannot update inventory.'
      });
    }
    
    // Use the first price to update inventory
    const firstPrice = prices[0];
    const priceId = firstPrice._id;
    
    // Update the price with new availableQuantity
    const updatedPrice = await ghlApiCall(`/products/${productId}/price/${priceId}?locationId=${GHL_LOCATION_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...firstPrice,
        availableQuantity: parseInt(quantity),
        trackInventory: true
      })
    });
    
    res.json({
      success: true,
      productId: productId,
      quantity: parseInt(quantity)
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ 
      error: 'Failed to update inventory in GoHighLevel',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});