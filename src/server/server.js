import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Helper function to generate product placeholder images
function generateProductPlaceholder(productName, productId) {
  // Clean product name for URL
  const cleanName = (productName || 'Producto').substring(0, 20);
  const encodedName = encodeURIComponent(cleanName);
  
  // Generate consistent color based on product ID
  const colors = [
    { bg: 'e2e8f0', text: '64748b' }, // slate
    { bg: 'f1f5f9', text: '475569' }, // slate light
    { bg: 'f8fafc', text: '334155' }, // slate lighter
    { bg: 'ecfccb', text: '365314' }, // lime
    { bg: 'dcfce7', text: '166534' }, // green
    { bg: 'dbeafe', text: '1e40af' }, // blue
    { bg: 'e0e7ff', text: '3730a3' }, // indigo
    { bg: 'f3e8ff', text: '6b21a8' }, // violet
  ];
  
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash + productId.charCodeAt(i)) & 0xffffffff;
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const { bg, text } = colors[colorIndex];
  
  return `https://via.placeholder.com/400x400/${bg}/${text}?text=${encodedName}`;
}

// Helper function to make GHL API calls
async function ghlApiCall(endpoint, options = {}) {
  const url = `${GHL_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Authorization': `Bearer ${GHL_API_TOKEN}`,
    'Content-Type': 'application/json',
    'version': '2021-04-15', // Required version header for GHL API v2
  };

  const config = {
    headers: defaultHeaders,
    ...options,
  };

  console.log(`Making GHL API call to: ${endpoint}`);
  console.log(`Headers:`, JSON.stringify(defaultHeaders, null, 2));
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GHL API Error (${response.status}):`, errorText);
      throw new Error(`GHL API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`GHL API Response for ${endpoint}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('GHL API Call failed:', error);
    throw error;
  }
}

// Routes

// GET /api/products - Get all products with pricing information
app.get('/api/products', async (req, res) => {
  try {
    console.log('Fetching products from GoHighLevel...');

    const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

    const page = Number.parseInt(pageParam ?? '1', 10);
    const limit = Number.parseInt(limitParam ?? '20', 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 300) : 20;
    const offset = (safePage - 1) * safeLimit;

    // Get products from GoHighLevel API with locationId parameter
    const productsResponse = await ghlApiCall(`/products/?locationId=${GHL_LOCATION_ID}`);
    const allProducts = productsResponse.products || [];

    // For each product, get pricing information
    const productsWithPricing = await Promise.all(
      allProducts.map(async (product) => {
        try {
          // Get prices for this product
          const pricesResponse = await ghlApiCall(`/products/${product._id}/price/?locationId=${GHL_LOCATION_ID}`);
          const prices = pricesResponse.prices || [];
          
          // Get the first price (or default values)
          const firstPrice = prices.length > 0 ? prices[0] : null;
          
          return {
            id: product._id,
            name: product.name,
            description: product.description || '',
            category: product.productType || 'General',
            price: firstPrice ? (firstPrice.amount / 100) : 0, // Convert from cents to pesos
            priceId: firstPrice ? firstPrice._id : null,
            currency: firstPrice ? firstPrice.currency : 'MXN',
            quantity: firstPrice ? (firstPrice.availableQuantity || 0) : 0,
            trackInventory: firstPrice ? (firstPrice.trackInventory || false) : false,
            image: product.image || generateProductPlaceholder(product.name, product._id)
          };
        } catch (error) {
          console.error(`Error fetching prices for product ${product._id}:`, error);
          return {
            id: product._id,
            name: product.name,
            description: product.description || '',
            category: product.productType || 'General',
            price: 0,
            priceId: null,
            currency: 'MXN',
            quantity: 0,
            trackInventory: false,
            image: product.image || generateProductPlaceholder(product.name, product._id)
          };
        }
      })
    );

  const total = productsWithPricing.length;
  const paginatedProducts = productsWithPricing.slice(offset, offset + safeLimit);
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;
    const hasNext = offset + paginatedProducts.length < total;

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
    
    // Convert price from pesos to cents
    const priceInCents = Math.round(parseFloat(price) * 100);
    
    // Update price via GoHighLevel API
    const updatedPrice = await ghlApiCall(`/products/${productId}/price/${priceId}?locationId=${GHL_LOCATION_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: priceInCents,
        currency: 'MXN'
      })
    });
    
    res.json({
      success: true,
      price: updatedPrice.amount / 100, // Convert back to pesos
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