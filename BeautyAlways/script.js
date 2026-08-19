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

let currentView = 'grid'; // 'grid' or 'list'
let debounceTimer = null;

// ============================================================
//  CURRENCY STATE
// ============================================================
let currentCurrency = 'USD';
let exchangeRates = { USD: 1 };
let lastProducts = []; // store last fetched products for re-render

// Currency symbols
const currencySymbols = {
  USD: '$',
  THB: '฿',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
};

// ============================================================
//  EXCHANGE RATE FETCHER (Free API)
// ============================================================
async function fetchExchangeRates(base = 'USD') {
  try {
    // Using free ExchangeRate-API (no key needed for demo)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );
    if (!response.ok) throw new Error('Rate fetch failed');
    const data = await response.json();
    return data.rates;
  } catch (err) {
    console.warn('Exchange rate API error, using fallback rates:', err);
    // Fallback rates (approximate, updated manually)
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
function formatPrice(usdPrice, currency, rates) {
  if (!usdPrice || isNaN(usdPrice)) return 'Price N/A';
  
  const rate = rates[currency] || 1;
  const converted = usdPrice * rate;
  const symbol = currencySymbols[currency] || '$';
  
  // Format based on currency
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
  // Update active button
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.currency === currentCurrency);
  });
  
  // Update "updated" timestamp
  const now = new Date();
  const updatedEl = document.getElementById('currencyUpdated');
  if (updatedEl) {
    updatedEl.textContent = `Rates updated: ${now.toLocaleDateString()}`;
  }
  
  // Re-render products with new currency
  if (lastProducts && lastProducts.length > 0) {
    renderProducts(lastProducts);
  }
}

// ============================================================
//  API CALL
// ============================================================
async function fetchProducts(query) {
  if (!query || query.trim().length < 1) return [];
  try {
    const url = `https://makeup-api.herokuapp.com/api/v1/products.json?name=${encodeURIComponent(query.trim())}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return data;
  } catch (err) {
    console.warn('API fetch error:', err);
    return [];
  }
}

// ============================================================
//  RENDER FUNCTIONS
// ============================================================
function renderProducts(products) {
  lastProducts = products; // store for currency re-renders
  
  emptyState.style.display = 'none';

  if (!products || products.length === 0) {
    resultsContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  const isGridView = (currentView === 'grid');
  resultsContainer.innerHTML = '';
  resultsContainer.className = isGridView ? 'results-grid' : 'results-list';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = p.image_link || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f4ede8"/%3E%3Ctext x="50" y="55" font-family="Inter" font-size="12" fill="%23b2a69c" text-anchor="middle"%3Eno image%3C/text%3E%3C/svg%3E';
    img.alt = p.name || 'Product';
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'p-info';

    const name = document.createElement('div');
    name.className = 'p-name';
    name.textContent = p.name || 'Unnamed';

    const brand = document.createElement('div');
    brand.className = 'p-brand';
    brand.textContent = p.brand || 'Unknown brand';

    const type = document.createElement('div');
    type.className = 'p-type';
    type.textContent = p.product_type || 'General';

    // ---- PRICE WITH CURRENCY ----
    const price = document.createElement('div');
    price.className = 'p-price';
    const usdPrice = parseFloat(p.price);
    if (!isNaN(usdPrice) && usdPrice > 0) {
      price.textContent = formatPrice(usdPrice, currentCurrency, exchangeRates);
    } else {
      price.textContent = 'Price N/A';
    }

    const rating = document.createElement('div');
    rating.className = 'p-rating';
    const r = p.rating || 0;
    rating.textContent = r > 0 ? `★ ${r.toFixed(1)}` : '☆ no ratings';

    info.append(name, brand, type, price, rating);
    card.append(img, info);
    resultsContainer.appendChild(card);
  });
}

// ============================================================
//  AUTOCOMPLETE
// ============================================================
async function handleSearchInput(query) {
  if (!query || query.trim().length < 2) {
    autocompleteList.classList.remove('active');
    return;
  }

  const products = await fetchProducts(query);
  if (!products || products.length === 0) {
    autocompleteList.classList.remove('active');
    return;
  }

  autocompleteList.innerHTML = '';
  const slice = products.slice(0, 8);
  slice.forEach(p => {
    const item = document.createElement('div');
    item.className = 'ac-item';

    const img = document.createElement('img');
    img.src = p.image_link || '';
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };

    const info = document.createElement('div');
    info.className = 'ac-info';

    const name = document.createElement('span');
    name.className = 'ac-name';
    name.textContent = p.name || 'Unnamed';

    const meta = document.createElement('div');
    meta.className = 'ac-meta';
    const brandSpan = document.createElement('span');
    brandSpan.textContent = p.brand || 'No brand';
    const typeSpan = document.createElement('span');
    typeSpan.textContent = p.product_type || 'General';
    meta.append(brandSpan, typeSpan);

    info.append(name, meta);
    item.append(img, info);

    item.addEventListener('click', () => {
      searchInput.value = p.name || '';
      autocompleteList.classList.remove('active');
      renderProducts([p]);
    });

    autocompleteList.appendChild(item);
  });
  autocompleteList.classList.add('active');
}

async function fetchAndRender(query) {
  const products = await fetchProducts(query);
  renderProducts(products);
}

// ============================================================
//  EVENT LISTENERS
// ============================================================

// Search input with debounce
searchInput.addEventListener('input', (e) => {
  const val = e.target.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    handleSearchInput(val);
  }, 280);
});

// Close autocomplete on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper')) {
    autocompleteList.classList.remove('active');
  }
});

// Enter key: fetch and render, close autocomplete
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    autocompleteList.classList.remove('active');
    fetchAndRender(searchInput.value);
  }
});

// ----- GRID / LIST TOGGLE -----
gridViewBtn.addEventListener('click', () => {
  currentView = 'grid';
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  const lastQuery = searchInput.value.trim();
  if (lastQuery) fetchAndRender(lastQuery);
  else {
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
    
    // Fetch new exchange rates
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
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  // Fetch exchange rates
  exchangeRates = await fetchExchangeRates('USD');
  updateCurrencyUI();
  
  // Load default products
  searchInput.value = 'lipstick';
  fetchAndRender('lipstick');
});
