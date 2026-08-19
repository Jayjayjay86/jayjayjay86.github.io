// ============================================================
//  CHANNEL3 API CONFIG
// ============================================================
// IMPORTANT: This should be loaded from environment variables
// For GitHub Pages, we'll use a config file approach
const CHANNEL3_API_KEY = 'MbvJg8UkmC6A3knEYO2Vx8dOV2yZWb5Y5lVQw5zP';
const CHANNEL3_API_URL = 'https://api.trychannel3.com/v1/search';

// ============================================================
//  DOM REFS
// ============================================================
const searchInput = document.getElementById('searchInput');
const autocompleteList = document.getElementById('autocomplete-list');
const resultsContainer = document.getElementById('results-container');
const emptyState = document.getElementById('emptyState');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const proModal = document.getElementById('proModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalUpgradeBtn = document.getElementById('modalUpgradeBtn');

let currentView = 'grid';
let debounceTimer = null;
let isPro = false;

// ============================================================
//  CURRENCY STATE
// ============================================================
let currentCurrency = 'USD';
let exchangeRates = { USD: 1 };
let lastProducts = [];
let lastQuery = '';

const currencySymbols = {
  USD: '$',
  THB: '฿',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
};

// ============================================================
//  EXCHANGE RATE FETCHER
// ============================================================
async function fetchExchangeRates(base = 'USD') {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );
    if (!response.ok) throw new Error('Rate fetch failed');
    const data = await response.json();
    console.log('✅ Exchange rates loaded:', Object.keys(data.rates).length, 'currencies');
    return data.rates;
  } catch (err) {
    console.warn('⚠️ Exchange rate API error, using fallback rates:', err);
    return {
      USD: 1,
      THB: 34.5,
      GBP: 0.79,
      EUR: 0.92,
      JPY: 149.5,
    };
  }
}

// ============================================================
//  PRICE FORMATTER
// ============================================================
function formatPrice(price, currency, rates) {
  if (!price || isNaN(price)) return 'Price N/A';
  
  const rate = rates[currency] || 1;
  const converted = price * rate;
  const symbol = currencySymbols[currency] || '$';
  
  let formatted;
  if (currency === 'JPY') {
    formatted = Math.round(converted).toLocaleString();
  } else {
    formatted = converted.toFixed(2);
  }
  
  return `${symbol}${formatted}`;
}

// ============================================================
//  UPDATE CURRENCY UI
// ============================================================
function updateCurrencyUI() {
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.currency === currentCurrency);
  });
  
  const now = new Date();
  const updatedEl = document.getElementById('currencyUpdated');
  if (updatedEl) {
    updatedEl.textContent = `↻ ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  }
  
  if (lastProducts && lastProducts.length > 0) {
    renderProducts(lastProducts);
  }
}

// ============================================================
//  CHANNEL3 API CALL - MAIN SEARCH
// ============================================================
async function searchChannel3(query, category = 'Beauty & Personal Care') {
  if (!query || query.trim().length < 1) return [];
  
  const trimmedQuery = query.trim();
  console.log(`🔍 Searching Channel3 for: "${trimmedQuery}"`);
  updateDebugStatus('searching', trimmedQuery);
  
  try {
    const response = await fetch(CHANNEL3_API_URL, {
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
    console.error('❌ Channel3 API error:', err);
    updateDebugStatus('error', err.message);
    return [];
  }
}

// ============================================================
//  FALLBACK: Makeup API (if Channel3 fails)
// ============================================================
async function fetchMakeupAPI(query) {
  if (!query || query.trim().length < 1) return [];
  
  const trimmedQuery = query.trim();
  console.log(`🔄 Fallback: Searching Makeup API for "${trimmedQuery}"`);
  
  try {
    // Try multiple search strategies
    let strategies = [
      `name=${encodeURIComponent(trimmedQuery)}`,
      `brand=${encodeURIComponent(trimmedQuery)}`,
      `product_type=${encodeURIComponent(trimmedQuery)}`
    ];
    
    for (let strategy of strategies) {
      const url = `https://makeup-api.herokuapp.com/api/v1/products.json?${strategy}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`✅ Makeup API found ${data.length} products via ${strategy}`);
        return data;
      }
    }
    return [];
  } catch (err) {
    console.warn('⚠️ Makeup API fallback error:', err);
    return [];
  }
}

// ============================================================
//  MAIN FETCH FUNCTION - Try Channel3 first, fallback to Makeup
// ============================================================
async function fetchProducts(query) {
  if (!query || query.trim().length < 1) return [];
  
  // Try Channel3 first
  let products = await searchChannel3(query);
  
  // If no results, try Makeup API as fallback
  if (!products || products.length === 0) {
    console.log('📭 No Channel3 results, trying Makeup API fallback...');
    products = await fetchMakeupAPI(query);
  }
  
  return products || [];
}

// ============================================================
//  DEBUG PANEL
// ============================================================
function updateDebugStatus(status, detail) {
  const statusEl = document.getElementById('debugStatus');
  const detailEl = document.getElementById('debugDetail');
  if (statusEl) {
    const icons = {
      'searching': '⏳',
      'complete': '✅',
      'error': '❌',
      'idle': '💤'
    };
    statusEl.textContent = `${icons[status] || '🔍'} ${status}`;
  }
  if (detailEl) {
    detailEl.textContent = detail || '';
  }
}

// ============================================================
//  RENDER FUNCTIONS - Updated for Channel3 data structure
// ============================================================
function renderProducts(products) {
  lastProducts = products;
  emptyState.style.display = 'none';

  // Update debug info
  const countEl = document.getElementById('debugCount');
  if (countEl) countEl.textContent = products ? products.length : 0;
  
  const queryEl = document.getElementById('debugQuery');
  if (queryEl) queryEl.textContent = lastQuery || 'none';

  if (!products || products.length === 0) {
    resultsContainer.innerHTML = '';
    emptyState.style.display = 'block';
    console.log('📭 No products to display');
    return;
  }

  const isGridView = (currentView === 'grid');
  resultsContainer.innerHTML = '';
  resultsContainer.className = isGridView ? 'results-grid' : 'results-list';

  products.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Debug first 3 products
    if (index < 3) {
      console.log(`📦 Product ${index + 1}:`, p.title || p.name || 'Unnamed');
    }

    // Image - handle both Channel3 and Makeup API formats
    const imageSrc = p.images?.[0] || p.image_link || p.api_featured_image || '';
    
    const img = document.createElement('img');
    if (imageSrc) {
      img.src = imageSrc;
      img.onerror = function() {
        console.warn(`⚠️ Failed to load image for: ${p.title || p.name}`);
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f4ede8"/%3E%3Ctext x="50" y="55" font-family="Inter" font-size="12" fill="%23b2a69c" text-anchor="middle"%3Eno image%3C/text%3E%3C/svg%3E';
      };
    } else {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f4ede8"/%3E%3Ctext x="50" y="55" font-family="Inter" font-size="12" fill="%23b2a69c" text-anchor="middle"%3Eno image%3C/text%3E%3C/svg%3E';
    }
    img.alt = p.title || p.name || 'Product';
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'p-info';

    // Name - handle both formats
    const name = document.createElement('div');
    name.className = 'p-name';
    name.textContent = p.title || p.name || 'Unnamed';

    // Brand
    const brand = document.createElement('div');
    brand.className = 'p-brand';
    brand.textContent = p.brand || 'Unknown brand';

    // Category/Type
    const type = document.createElement('div');
    type.className = 'p-type';
    type.textContent = p.category || p.product_type || 'General';

    // Price - handle Channel3's price object
    let priceValue = null;
    if (p.price) {
      if (typeof p.price === 'object' && p.price.amount) {
        priceValue = parseFloat(p.price.amount);
      } else if (typeof p.price === 'number') {
        priceValue = p.price;
      } else if (typeof p.price === 'string') {
        priceValue = parseFloat(p.price);
      }
    }
    
    const price = document.createElement('div');
    price.className = 'p-price';
    if (priceValue && !isNaN(priceValue) && priceValue > 0) {
      price.textContent = formatPrice(priceValue, currentCurrency, exchangeRates);
    } else {
      price.textContent = 'Price N/A';
    }

    // Rating
    const rating = document.createElement('div');
    rating.className = 'p-rating';
    const r = p.rating || 0;
    rating.textContent = r > 0 ? `★ ${typeof r === 'number' ? r.toFixed(1) : r}` : '☆ no ratings';

    // Merchant link (Channel3 feature)
    if (p.merchant_link || p.product_link) {
      const link = document.createElement('a');
      link.href = p.merchant_link || p.product_link || '#';
      link.target = '_blank';
      link.className = 'p-link';
      link.textContent = '🛒 View Product';
      link.style.cssText = `
        display: inline-block;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: #b07f6a;
        text-decoration: none;
        border: 1px solid #e5ddd8;
        padding: 0.2rem 0.8rem;
        border-radius: 20px;
        transition: 0.2s;
      `;
      link.onmouseover = () => {
        link.style.background = '#fcf8f5';
        link.style.borderColor = '#b5978a';
      };
      link.onmouseout = () => {
        link.style.background = 'transparent';
        link.style.borderColor = '#e5ddd8';
      };
      info.appendChild(link);
    }

    info.append(name, brand, type, price, rating);
    card.append(img, info);
    resultsContainer.appendChild(card);
  });
  
  console.log(`✅ Rendered ${products.length} products`);
}

// ============================================================
//  MAIN SEARCH FUNCTION
// ============================================================
async function performSearch(query) {
  if (!query || query.trim().length < 1) {
    renderProducts([]);
    return;
  }
  
  lastQuery = query.trim();
  console.log(`🔎 PERFORMING SEARCH: "${lastQuery}"`);
  const products = await fetchProducts(lastQuery);
  renderProducts(products);
}

// ============================================================
//  AUTOCOMPLETE - Updated for Channel3
// ============================================================
async function handleAutocomplete(query) {
  if (!query || query.trim().length < 2) {
    autocompleteList.classList.remove('active');
    return;
  }

  const products = await fetchProducts(query);
  if (!products || products.length === 0) {
    autocompleteList.classList.remove('active');
    return;
  }

  // Sort by relevance
  const sorted = products.sort((a, b) => {
    const aName = (a.title || a.name || '').toLowerCase();
    const bName = (b.title || b.name || '').toLowerCase();
    const queryLower = query.toLowerCase();
    
    const aExact = aName === queryLower ? 1 : 0;
    const bExact = bName === queryLower ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return aName.length - bName.length;
  });

  const slice = sorted.slice(0, 10);
  autocompleteList.innerHTML = '';
  
  slice.forEach(p => {
    const item = document.createElement('div');
    item.className = 'ac-item';

    const img = document.createElement('img');
    const imageSrc = p.images?.[0] || p.image_link || p.api_featured_image || '';
    img.src = imageSrc;
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };

    const info = document.createElement('div');
    info.className = 'ac-info';

    const name = document.createElement('span');
    name.className = 'ac-name';
    name.textContent = p.title || p.name || 'Unnamed';

    const meta = document.createElement('div');
    meta.className = 'ac-meta';
    const brandSpan = document.createElement('span');
    brandSpan.textContent = p.brand || 'No brand';
    const typeSpan = document.createElement('span');
    typeSpan.textContent = p.category || p.product_type || 'General';
    meta.append(brandSpan, typeSpan);

    info.append(name, meta);
    item.append(img, info);

    item.addEventListener('click', () => {
      const selectedName = p.title || p.name || '';
      searchInput.value = selectedName;
      autocompleteList.classList.remove('active');
      performSearch(selectedName);
      clearBtn.style.display = 'block';
    });

    autocompleteList.appendChild(item);
  });
  autocompleteList.classList.add('active');
}

// ============================================================
//  CLEAR SEARCH FUNCTION
// ============================================================
function clearSearch() {
  searchInput.value = '';
  lastQuery = '';
  renderProducts([]);
  autocompleteList.classList.remove('active');
  clearBtn.style.display = 'none';
  updateDebugStatus('idle', 'cleared');
  console.log('🧹 Search cleared');
}

// ============================================================
//  EVENT LISTENERS
// ============================================================

// Search input
searchInput.addEventListener('input', (e) => {
  const val = e.target.value;
  clearBtn.style.display = val ? 'block' : 'none';
  clearTimeout(debounceTimer);
  
  if (!val || val.trim().length === 0) {
    renderProducts([]);
    autocompleteList.classList.remove('active');
    return;
  }
  
  if (val.trim().length < 2) {
    autocompleteList.classList.remove('active');
    return;
  }
  
  debounceTimer = setTimeout(() => {
    handleAutocomplete(val);
  }, 300);
});

// Enter key
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = searchInput.value.trim();
    autocompleteList.classList.remove('active');
    if (val) {
      performSearch(val);
    }
  }
});

// Close autocomplete
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper')) {
    autocompleteList.classList.remove('active');
  }
});

// ----- GRID / LIST TOGGLE -----
gridViewBtn.addEventListener('click', () => {
  currentView = 'grid';
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  if (lastProducts && lastProducts.length > 0) {
    renderProducts(lastProducts);
  } else if (lastQuery) {
    performSearch(lastQuery);
  } else {
    resultsContainer.className = 'results-grid';
  }
});

listViewBtn.addEventListener('click', () => {
  proModal.style.display = 'flex';
});

// ----- CURRENCY TOGGLE -----
document.querySelectorAll('.currency-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const currency = btn.dataset.currency;
    if (currency === currentCurrency) return;
    
    currentCurrency = currency;
    console.log(`💱 Currency changed to: ${currency}`);
    exchangeRates = await fetchExchangeRates('USD');
    updateCurrencyUI();
  });
});

// ----- MODAL CONTROLS -----
function closeModal() {
  proModal.style.display = 'none';
}
modalCloseBtn.addEventListener('click', closeModal);
modalUpgradeBtn.addEventListener('click', () => {
  alert('✨ Demo: This is where you would integrate Stripe / PayPal. For now, enjoy the unlimited free Grid view!');
  closeModal();
});
proModal.addEventListener('click', (e) => {
  if (e.target === proModal) closeModal();
});

// ============================================================
//  ADD CLEAR BUTTON & DEBUG PANEL
// ============================================================
const searchWrapper = document.querySelector('.search-wrapper');
const clearBtn = document.createElement('button');
clearBtn.id = 'clearSearch';
clearBtn.textContent = '✕';
clearBtn.style.cssText = `
  position: absolute;
  right: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #b2a69c;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 50%;
  display: none;
  transition: 0.2s;
`;
clearBtn.addEventListener('click', clearSearch);
searchWrapper.appendChild(clearBtn);

// Debug panel
const debugPanel = document.createElement('div');
debugPanel.id = 'debugPanel';
debugPanel.style.cssText = `
  margin: 1rem auto 1.5rem;
  padding: 0.8rem 1.2rem;
  background: #f8f3f0;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #5a4a40;
  border: 1px solid #f0e8e2;
  max-width: 640px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  align-items: center;
  font-family: 'Inter', monospace;
`;
debugPanel.innerHTML = `
  <span>🔍 <span id="debugStatus">💤 idle</span></span>
  <span>📦 <span id="debugCount">0</span> products</span>
  <span>🔎 "<span id="debugQuery">none</span>"</span>
  <span id="debugDetail" style="color:#b2a69c;font-size:0.7rem;"></span>
  <button id="debugLogBtn" style="
    margin-left: auto;
    background: none;
    border: 1px solid #e5ddd8;
    border-radius: 20px;
    padding: 0.2rem 0.8rem;
    cursor: pointer;
    font-size: 0.7rem;
  ">📋 Log</button>
  <button id="debugTestBtn" style="
    background: none;
    border: 1px solid #d4a58c;
    border-radius: 20px;
    padding: 0.2rem 0.8rem;
    cursor: pointer;
    font-size: 0.7rem;
    color: #b07f6a;
  ">🧪 Test Search</button>
`;
searchWrapper.parentNode.insertBefore(debugPanel, searchWrapper.nextSibling);

// Debug log button
document.getElementById('debugLogBtn')?.addEventListener('click', () => {
  console.log('=== DEBUG INFO ===');
  console.log('Last query:', lastQuery);
  console.log('Products:', lastProducts);
  console.log('Products count:', lastProducts?.length || 0);
  console.log('Currency:', currentCurrency);
  console.log('Exchange rates:', exchangeRates);
  console.log('Current view:', currentView);
  console.log('Search input value:', searchInput.value);
  console.log('API Key:', CHANNEL3_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('=================');
});

// Test search button
document.getElementById('debugTestBtn')?.addEventListener('click', () => {
  const testQueries = ['lipstick', 'foundation', 'blush', 'mascara', 'eyeshadow', 'concealer'];
  const random = testQueries[Math.floor(Math.random() * testQueries.length)];
  console.log(`🧪 Testing search with: "${random}"`);
  searchInput.value = random;
  performSearch(random);
  clearBtn.style.display = 'block';
});

// ============================================================
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Beauty Always App Starting...');
  console.log('🔑 Channel3 API Key:', CHANNEL3_API_KEY ? '✓ Configured' : '✗ Missing');
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
  
  console.log('✅ App ready with Channel3 integration!');
  console.log('💡 Channel3 provides live product data with prices and availability');
  console.log('💡 Try searching: lipstick, foundation, blush, mascara');
});
