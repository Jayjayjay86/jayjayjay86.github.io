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
  emptyState.style.display = 'none';

  if (!products || products.length === 0) {
    resultsContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  // Grid is the only functional view; list view is locked.
  // We always render grid, but if list is clicked we show modal.
  const isGridView = (currentView === 'grid');
  
  // Clear and set class
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

    const price = document.createElement('div');
    price.className = 'p-price';
    price.textContent = p.price ? `$${p.price}` : 'Price N/A';

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

  // Show top 8 matches in dropdown
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

    // On click, fill search and show results
    item.addEventListener('click', () => {
      searchInput.value = p.name || '';
      autocompleteList.classList.remove('active');
      renderProducts([p]); // show that single product, or we could fetch full list again
      // Better: fetch all matching to show similar ones
      fetchAndRender(searchInput.value);
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
  // Re-render existing results in grid
  const currentItems = resultsContainer.querySelectorAll('.product-card');
  if (currentItems.length > 0) {
    // We need to re-render with grid class
    // Simplest: re-run the last search. We'll store last query.
    const lastQuery = searchInput.value.trim();
    if (lastQuery) fetchAndRender(lastQuery);
    else {
      resultsContainer.className = 'results-grid';
      // no content change needed, just class
    }
  } else {
    resultsContainer.className = 'results-grid';
  }
});

listViewBtn.addEventListener('click', () => {
  // Paywall: Show the Pro modal
  proModal.style.display = 'flex';
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
//  INIT: load some default products on startup
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Show a curated default set (e.g., "lipstick" to look beautiful)
  searchInput.value = 'lipstick';
  fetchAndRender('lipstick');
});