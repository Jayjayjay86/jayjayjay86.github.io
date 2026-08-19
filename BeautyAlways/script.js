// ============================================================
//  CHANNEL3 API CONFIG with CORS Proxy
// ============================================================

const MAKEUP_API_URL = 'https://makeup-api.herokuapp.com/api/v1/products.json';

// CORS Proxy - use this to bypass CORS restrictions
// You can also use: https://api.allorigins.win/raw?url=
const CORS_PROXY = 'https://corsproxy.io/?';

// ============================================================
//  API CALLS with CORS Proxy
// ============================================================

// Helper function to handle API calls with proxy fallback
async function fetchWithProxy(url, options = {}) {
  try {
    // Try direct first (may work in some browsers)
    console.log(`🔄 Trying direct: ${url}`);
    const response = await fetch(url, options);
    if (response.ok) return response;
    throw new Error('Direct fetch failed');
  } catch (err) {
    console.log(`⚠️ Direct failed, trying proxy...`);
    
    // Try with proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const proxyOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    };
    
    // If it's a POST request, we need to handle it differently with the proxy
    if (options.method === 'POST') {
      // Some proxies only support GET, so we need to send POST data differently
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...JSON.parse(options.body || '{}'),
          // Some proxies need the API key in the body
          api_key: CHANNEL3_API_KEY
        })
      });
      return response;
    }
    
    const response = await fetch(proxyUrl, proxyOptions);
    return response;
  }
}

async function searchChannel3(query, category = 'Beauty & Personal Care') {
  if (!query || query.trim().length < 1) return [];
  
  const trimmedQuery = query.trim();
  console.log(`🔍 Searching Channel3 for: "${trimmedQuery}"`);
  updateDebugStatus('searching', trimmedQuery);
  
  try {
    const response = await fetchWithProxy(CHANNEL3_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CHANNEL3_API_KEY
      },
      body: JSON.stringify({
        query: trimmedQuery,
        category: category,
        limit: 20
      })
    });
    
    if (!response.ok) {
      throw new Error(`Channel3 API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Channel3 found ${data.products ? data.products.length : 0} products`);
    updateDebugStatus('complete', data.products ? data.products.length : 0);
    return data.products || [];
  } catch (err) {
    console.warn('⚠️ Channel3 failed, trying fallback...', err.message);
    updateDebugStatus('error', err.message);
    // Fallback to Makeup API
    return await searchMakeupAPI(trimmedQuery);
  }
}

async function searchMakeupAPI(query) {
  if (!query || query.trim().length < 1) return [];
  
  const trimmedQuery = query.trim();
  console.log(`🔄 Fallback: Searching Makeup API for "${trimmedQuery}"`);
  
  try {
    // Try multiple search strategies
    const strategies = [
      `name=${encodeURIComponent(trimmedQuery)}`,
      `brand=${encodeURIComponent(trimmedQuery)}`,
      `product_type=${encodeURIComponent(trimmedQuery)}`
    ];
    
    for (const strategy of strategies) {
      const url = `${MAKEUP_API_URL}?${strategy}`;
      console.log(`📡 Trying: ${url}`);
      
      try {
        // Use the proxy for Makeup API too
        const response = await fetchWithProxy(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            console.log(`✅ Makeup API found ${data.length} products via ${strategy}`);
            // Convert to Channel3-like format
            return data.map(p => ({
              title: p.name,
              brand: p.brand,
              price: parseFloat(p.price),
              images: [p.image_link || p.api_featured_image].filter(Boolean),
              category: p.product_type,
              rating: p.rating || 0,
              merchant_link: p.product_link,
              description: p.description,
              colors: p.product_colors || []
            }));
          }
        }
      } catch (err) {
        console.log(`⚠️ Strategy ${strategy} failed:`, err.message);
      }
    }
    return [];
  } catch (err) {
    console.error('❌ Makeup API error:', err);
    return [];
  }
}

// ============================================================
//  MAIN FETCH FUNCTION
// ============================================================
async function fetchProducts(query) {
  if (!query || query.trim().length < 1) return [];
  
  // Try Channel3 first
  let products = await searchChannel3(query);
  
  // If no results, try Makeup API as fallback
  if (!products || products.length === 0) {
    console.log('📭 No Channel3 results, trying Makeup API fallback...');
    products = await searchMakeupAPI(query);
  }
  
  return products || [];
}

// ============================================================
//  REST OF YOUR CODE (Debug Panel, Render, etc.)
// ============================================================

// ... keep your existing renderProducts, updateDebugStatus, etc. functions ...
// ... keep your existing event listeners ...

// ============================================================
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Beauty Always App Starting...');
  console.log('🔑 Channel3 API Key:', CHANNEL3_API_KEY ? '✓ Configured' : '✗ Missing');
  console.log('🔄 CORS Proxy:', CORS_PROXY);
  console.log('📡 Fetching exchange rates...');
  exchangeRates = await fetchExchangeRates('USD');
  updateCurrencyUI();
  
  // Load default products
  const defaultQuery = 'lipstick';
  searchInput.value = defaultQuery;
  lastQuery = defaultQuery;
  console.log(`🔍 Loading default: "${defaultQuery}"`);
  await performSearch(defaultQuery);
  
  clearBtn.style.display = 'block';
  
  console.log('✅ App ready with CORS proxy!');
  console.log('💡 Try searching: lipstick, foundation, blush, mascara');
});
