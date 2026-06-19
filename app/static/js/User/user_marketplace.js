// Marketplace JavaScript - Shopping Cart & Checkout Functionality

let allProducts = [];
let cart = [];
let currentFilter = 'all';
let searchQuery = '';
let activeFilters = {
    categories: [],
    ingredients: [],
    priceRange: { min: 0, max: 5000 },
    offers: []
};
let currentSort = 'relevance';
const stageFilterFromQuery = resolveStageFromQuery();

function resolveStageFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const stageParam = params.get('stage');
    if (!stageParam) {
        return null;
    }
    const normalized = stageParam.toLowerCase();
    if (normalized.includes('normal')) return 'Normal';
    if (normalized.includes('stage 1')) return 'Stage 1';
    if (normalized.includes('stage 2')) return 'Stage 2';
    if (normalized.includes('stage 3')) return 'Stage 3';
    if (normalized.includes('bald') || normalized.includes('advanced')) return 'Bald';
    return null;
}

// Natural Ingredients Products Data
const naturalProducts = [
    // Normal Scalp Products
    {
        ID: 1,
        NAME: "Organic Coconut Oil",
        PRICE: 299,
        IMAGE: "https://images.unsplash.com/photo-1615485925511-48a75b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Pure cold-pressed coconut oil rich in lauric acid. Deeply moisturizes scalp and strengthens hair follicles naturally.",
        BRAND: "Natural Essence",
        BENEFITS: "Moisturizes, Strengthens, Prevents breakage",
        CATEGORY: "Normal",
        BEST_SELLER: 1,
        INGREDIENTS: ["Coconut Oil", "Vitamin E", "Lauric Acid"],
        UNIT: "250ml"
    },
    {
        ID: 2,
        NAME: "Aloe Vera Gel Extract",
        PRICE: 349,
        IMAGE: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "100% pure aloe vera gel with cooling properties. Soothes scalp irritation and promotes healthy hair growth.",
        BRAND: "Pure Nature",
        BENEFITS: "Soothes scalp, Reduces inflammation, Promotes growth",
        CATEGORY: "Normal",
        BEST_SELLER: 0,
        INGREDIENTS: ["Aloe Vera", "Water", "Natural Preservatives"],
        UNIT: "500ml"
    },
    {
        ID: 3,
        NAME: "Rosemary Essential Oil",
        PRICE: 599,
        IMAGE: "https://images.unsplash.com/photo-1615485925511-48a75b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Therapeutic grade rosemary oil that improves circulation and stimulates hair follicles for thicker, stronger hair.",
        BRAND: "Aromatherapy Plus",
        BENEFITS: "Stimulates growth, Improves circulation, Strengthens roots",
        CATEGORY: "Normal",
        BEST_SELLER: 1,
        INGREDIENTS: ["Rosemary Oil", "Carrier Oil", "Vitamin E"],
        UNIT: "30ml"
    },
    // Stage 1 Products
    {
        ID: 4,
        NAME: "Biotin & Saw Palmetto Complex",
        PRICE: 799,
        IMAGE: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Powerful combination of biotin and saw palmetto to combat early hair loss. Blocks DHT and promotes new growth.",
        BRAND: "Hair Vitality",
        BENEFITS: "Blocks DHT, Promotes growth, Strengthens follicles",
        CATEGORY: "Stage 1",
        BEST_SELLER: 1,
        INGREDIENTS: ["Biotin", "Saw Palmetto", "Zinc", "Iron", "Vitamin D"],
        UNIT: "60 capsules"
    },
    {
        ID: 5,
        NAME: "Peppermint & Tea Tree Scalp Serum",
        PRICE: 449,
        IMAGE: "https://images.unsplash.com/photo-1608571423538-8b1e0e8b5c5b?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Cooling serum with peppermint and tea tree oil. Unclogs hair follicles and stimulates blood flow to scalp.",
        BRAND: "Scalp Care Pro",
        BENEFITS: "Unclogs follicles, Stimulates circulation, Reduces buildup",
        CATEGORY: "Stage 1",
        BEST_SELLER: 0,
        INGREDIENTS: ["Peppermint Oil", "Tea Tree Oil", "Jojoba Oil", "Vitamin B5"],
        UNIT: "50ml"
    },
    {
        ID: 6,
        NAME: "Fenugreek Seed Hair Mask",
        PRICE: 399,
        IMAGE: "https://images.unsplash.com/photo-1615485925511-48a75b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Traditional fenugreek seed mask rich in proteins and lecithin. Nourishes hair roots and prevents thinning.",
        BRAND: "Ayurvedic Roots",
        BENEFITS: "Nourishes roots, Prevents thinning, Adds volume",
        CATEGORY: "Stage 1",
        BEST_SELLER: 1,
        INGREDIENTS: ["Fenugreek Seeds", "Yogurt", "Honey", "Lemon"],
        UNIT: "200g"
    },
    // Stage 2 Products
    {
        ID: 7,
        NAME: "Onion Juice & Garlic Extract",
        PRICE: 499,
        IMAGE: "https://images.unsplash.com/photo-1618512496249-5a3cd9f85b0a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Concentrated onion and garlic extract with sulfur compounds. Proven to regrow hair and reduce hair fall significantly.",
        BRAND: "Natural Regrowth",
        BENEFITS: "Regrows hair, Reduces fall, Rich in sulfur",
        CATEGORY: "Stage 2",
        BEST_SELLER: 1,
        INGREDIENTS: ["Onion Juice", "Garlic Extract", "Aloe Vera", "Vitamin C"],
        UNIT: "100ml"
    },
    {
        ID: 8,
        NAME: "Ginseng & Green Tea Scalp Treatment",
        PRICE: 899,
        IMAGE: "https://images.unsplash.com/photo-1608571423538-8b1e0e8b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Potent blend of ginseng root and green tea antioxidants. Revitalizes dormant follicles and promotes active growth.",
        BRAND: "Elite Hair Care",
        BENEFITS: "Revitalizes follicles, Antioxidant protection, Promotes growth",
        CATEGORY: "Stage 2",
        BEST_SELLER: 0,
        INGREDIENTS: ["Ginseng Extract", "Green Tea", "Caffeine", "Niacin"],
        UNIT: "75ml"
    },
    {
        ID: 9,
        NAME: "Castor Oil & Amla Hair Oil",
        PRICE: 549,
        IMAGE: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Traditional Indian hair oil combining castor oil's ricinoleic acid with amla's vitamin C. Thickens hair and prevents breakage.",
        BRAND: "Herbal Traditions",
        BENEFITS: "Thickens hair, Prevents breakage, Rich in nutrients",
        CATEGORY: "Stage 2",
        BEST_SELLER: 1,
        INGREDIENTS: ["Castor Oil", "Amla Extract", "Bhringraj", "Coconut Oil"],
        UNIT: "200ml"
    },
    // Stage 3 Products
    {
        ID: 10,
        NAME: "Minoxidil Alternative - Natural DHT Blocker",
        PRICE: 1299,
        IMAGE: "https://images.unsplash.com/photo-1615485925511-48a75b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Advanced natural formula with pumpkin seed oil, pygeum, and stinging nettle. Blocks DHT effectively without side effects.",
        BRAND: "Advanced Naturals",
        BENEFITS: "Blocks DHT, No side effects, Promotes regrowth",
        CATEGORY: "Stage 3",
        BEST_SELLER: 1,
        INGREDIENTS: ["Pumpkin Seed Oil", "Pygeum", "Stinging Nettle", "Saw Palmetto", "Zinc"],
        UNIT: "120ml"
    },
    {
        ID: 11,
        NAME: "Redensyl & Procapil Complex",
        PRICE: 1499,
        IMAGE: "https://images.unsplash.com/photo-1608571423538-8b1e0e8b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Clinical-grade natural peptides that reactivate hair follicles. Contains redensyl, procapil, and baicapil for maximum efficacy.",
        BRAND: "Clinical Naturals",
        BENEFITS: "Reactivates follicles, Clinical proven, Maximum efficacy",
        CATEGORY: "Stage 3",
        BEST_SELLER: 1,
        INGREDIENTS: ["Redensyl", "Procapil", "Baicapil", "Biotin", "Peptides"],
        UNIT: "100ml"
    },
    {
        ID: 12,
        NAME: "Hibiscus & Curry Leaves Hair Pack",
        PRICE: 449,
        IMAGE: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Traditional hair pack with hibiscus flowers and curry leaves. Rich in amino acids and antioxidants for hair regeneration.",
        BRAND: "Traditional Care",
        BENEFITS: "Hair regeneration, Rich in amino acids, Antioxidant rich",
        CATEGORY: "Stage 3",
        BEST_SELLER: 0,
        INGREDIENTS: ["Hibiscus", "Curry Leaves", "Henna", "Amla", "Shikakai"],
        UNIT: "300g"
    },
    // Bald/Advanced Care Products
    {
        ID: 13,
        NAME: "Stem Cell Hair Serum",
        PRICE: 1999,
        IMAGE: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Revolutionary plant stem cell extract that activates dormant hair follicles. Contains apple stem cells and growth factors.",
        BRAND: "Revive Hair Labs",
        BENEFITS: "Activates follicles, Plant stem cells, Growth factors",
        CATEGORY: "Bald",
        BEST_SELLER: 1,
        INGREDIENTS: ["Apple Stem Cells", "Growth Factors", "Peptides", "Biotin", "Copper"],
        UNIT: "60ml"
    },
    {
        ID: 14,
        NAME: "Complete Hair Regrowth System",
        PRICE: 2499,
        IMAGE: "https://images.unsplash.com/photo-1615485925511-48a75b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Comprehensive 3-step system with scalp exfoliant, growth serum, and nourishing oil. Designed for advanced hair loss stages.",
        BRAND: "Complete Care",
        BENEFITS: "Complete system, Scalp exfoliation, Growth support",
        CATEGORY: "Bald",
        BEST_SELLER: 1,
        INGREDIENTS: ["Salicylic Acid", "Minoxidil Alternative", "Essential Oils", "Vitamins", "Minerals"],
        UNIT: "3-piece set"
    },
    {
        ID: 15,
        NAME: "Micro-needling Scalp Roller + Serum",
        PRICE: 1799,
        IMAGE: "https://images.unsplash.com/photo-1608571423538-8b1e0e8b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Derma roller with natural growth serum. Micro-needling stimulates collagen production and enhances serum absorption.",
        BRAND: "Derma Hair Pro",
        BENEFITS: "Stimulates collagen, Enhances absorption, Natural growth",
        CATEGORY: "Bald",
        BEST_SELLER: 0,
        INGREDIENTS: ["Derma Roller", "Peptide Serum", "Hyaluronic Acid", "Growth Factors"],
        UNIT: "1 set"
    },
    {
        ID: 16,
        NAME: "Argan Oil & Jojoba Blend",
        PRICE: 699,
        IMAGE: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Luxurious blend of argan and jojoba oils. Deeply conditions scalp and creates optimal environment for hair growth.",
        BRAND: "Luxury Naturals",
        BENEFITS: "Deep conditioning, Optimal environment, Nourishing",
        CATEGORY: "Normal",
        BEST_SELLER: 0,
        INGREDIENTS: ["Argan Oil", "Jojoba Oil", "Vitamin E", "Rosemary"],
        UNIT: "150ml"
    },
    {
        ID: 17,
        NAME: "Brahmi & Shikakai Hair Wash",
        PRICE: 349,
        IMAGE: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Natural hair cleanser with brahmi and shikakai. Cleanses without stripping natural oils, promotes healthy scalp.",
        BRAND: "Ayurvedic Cleanse",
        BENEFITS: "Natural cleansing, Maintains oils, Healthy scalp",
        CATEGORY: "Normal",
        BEST_SELLER: 1,
        INGREDIENTS: ["Brahmi", "Shikakai", "Reetha", "Amla", "Hibiscus"],
        UNIT: "500ml"
    },
    {
        ID: 18,
        NAME: "Lavender & Chamomile Scalp Soother",
        PRICE: 399,
        IMAGE: "https://images.unsplash.com/photo-1615485925511-48a75b5c5b2a?w=600&h=600&fit=crop&q=80",
        DESCRIPTION: "Calming blend of lavender and chamomile essential oils. Reduces stress-related hair loss and promotes relaxation.",
        BRAND: "Calm Care",
        BENEFITS: "Reduces stress loss, Promotes relaxation, Calming",
        CATEGORY: "Stage 1",
        BEST_SELLER: 0,
        INGREDIENTS: ["Lavender Oil", "Chamomile Oil", "Carrier Oil", "Vitamin E"],
        UNIT: "50ml"
    }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    initializeProducts();
    setupEventListeners();
    setupFilterListeners();
    initializeFilterGroups();
});

// Initialize products
function initializeProducts() {
    // Try to fetch from API first, fallback to local data
    fetch('/api/database/products')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                allProducts = data.map(p => ({
                    ...p,
                    INGREDIENTS: p.BENEFITS ? p.BENEFITS.split(',').map(b => b.trim()) : [],
                    UNIT: '1 unit'
                }));
            } else {
                allProducts = naturalProducts;
            }
            // Set default filter state
            activeFilters.categories = ['all'];
            document.getElementById('resultsCount').textContent = allProducts.length;
            if (stageFilterFromQuery) {
                filterByCategory(stageFilterFromQuery);
            } else {
            filterProducts();
            }
        })
        .catch(error => {
            console.log('Using local product data');
            allProducts = naturalProducts;
            // Set default filter state
            activeFilters.categories = ['all'];
            document.getElementById('resultsCount').textContent = allProducts.length;
            if (stageFilterFromQuery) {
                filterByCategory(stageFilterFromQuery);
            } else {
            filterProducts();
            }
        });
}

// Setup event listeners
function setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
            filterProducts();
        });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = this.value.toLowerCase();
                filterProducts();
            }, 300);
        });
    }

    // Modal search
    const modalSearchInput = document.getElementById('modalSearchInput');
    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', function() {
            performSearch(this.value);
        });
    }
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="loading-spinner" style="grid-column: 1 / -1;">
                <i class="fas fa-search" style="font-size: 3rem; color: #6c757d; margin-bottom: 20px;"></i>
                <p>No products found matching your criteria.</p>
                <button onclick="clearAllFilters()" style="margin-top: 20px; padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const badge = product.BEST_SELLER == 1 ? '<div class="product-badge">Best Seller</div>' : '';
    const ingredients = product.INGREDIENTS || (product.BENEFITS ? product.BENEFITS.split(',').map(b => b.trim()) : []);
    const unit = product.UNIT || '1 unit';
    
    card.innerHTML = `
        ${badge}
        <div class="product-image-container" onclick="viewProduct(${product.ID})">
            <img src="${product.IMAGE || 'https://via.placeholder.com/400x300?text=Natural+Ingredient'}" 
                 alt="${product.NAME}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Natural+Ingredient'">
        </div>
        <div class="product-info">
            <div class="product-category">${product.CATEGORY || 'General'}</div>
            <h3 class="product-name">${product.NAME || 'Product'}</h3>
            <p class="product-description">${product.DESCRIPTION || 'Natural ingredient product'}</p>
            ${ingredients.length > 0 ? `
                <div class="product-ingredients">
                    <div class="ingredients-label">Key Ingredients</div>
                    <div class="ingredients-list">
                        ${ingredients.slice(0, 3).map(ing => `<span class="ingredient-tag">${ing}</span>`).join('')}
                        ${ingredients.length > 3 ? `<span class="ingredient-tag">+${ingredients.length - 3} more</span>` : ''}
                    </div>
                </div>
            ` : ''}
            <div class="product-footer">
                <div>
                    <div class="product-price">₹${product.PRICE || 0}</div>
                    <div class="product-price-unit">/${unit}</div>
                </div>
                <div class="product-actions">
                    <button class="btn-action btn-add-cart" onclick="addToCart(${product.ID}, event)">
                        <i class="fas fa-shopping-cart"></i> Add
                    </button>
                    <button class="btn-action btn-view" onclick="viewProduct(${product.ID})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Filter products
function filterProducts() {
    let filtered = [...allProducts];
    
    // Apply search filter
    if (searchQuery) {
        filtered = filtered.filter(p => 
            (p.NAME || '').toLowerCase().includes(searchQuery) ||
            (p.DESCRIPTION || '').toLowerCase().includes(searchQuery) ||
            (p.BENEFITS || '').toLowerCase().includes(searchQuery) ||
            (p.INGREDIENTS || []).some(ing => ing.toLowerCase().includes(searchQuery))
        );
    }
    
    // Apply category filters
    if (activeFilters.categories.length > 0) {
        if (!activeFilters.categories.includes('all')) {
            filtered = filtered.filter(p => 
                activeFilters.categories.includes(p.CATEGORY)
            );
        }
    }
    
    // Apply ingredient filters
    if (activeFilters.ingredients.length > 0) {
        filtered = filtered.filter(p => {
            const productIngredients = p.INGREDIENTS || (p.BENEFITS ? p.BENEFITS.split(',').map(b => b.trim()) : []);
            return activeFilters.ingredients.some(ing => 
                productIngredients.some(pi => pi.toLowerCase().includes(ing.toLowerCase()))
            );
        });
    }
    
    // Apply price range filter
    filtered = filtered.filter(p => {
        const price = parseFloat(p.PRICE) || 0;
        return price >= activeFilters.priceRange.min && price <= activeFilters.priceRange.max;
    });
    
    // Apply offer filters
    if (activeFilters.offers.includes('best-seller')) {
        filtered = filtered.filter(p => p.BEST_SELLER == 1 || p.BEST_SELLER === '1');
    }
    
    // Apply sorting
    sortProducts(currentSort, filtered);
    
    // Update results count
    document.getElementById('resultsCount').textContent = filtered.length;
    
    displayProducts(filtered);
    updateActiveFilterChips();
}

// Toggle filters sidebar (mobile)
function toggleFilters() {
    const sidebar = document.getElementById('filtersSidebar');
    const overlay = document.getElementById('filtersOverlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

// Toggle sidebar minimize/maximize (desktop)
function toggleSidebarMinimize() {
    const sidebar = document.getElementById('filtersSidebar');
    const content = document.querySelector('.marketplace-content');
    
    sidebar.classList.toggle('minimized');
    content.classList.toggle('sidebar-minimized');
}

// Filter by category from tabs
function filterByCategory(category) {
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.category-tab[data-category="${category}"]`).classList.add('active');
    
    // Update filter state
    if (category === 'all') {
        activeFilters.categories = ['all'];
        document.querySelectorAll('input[data-filter="category"]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelector('input[data-filter="category"][value="all"]').checked = true;
    } else {
        activeFilters.categories = [category];
        document.querySelectorAll('input[data-filter="category"]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelector(`input[data-filter="category"][value="${category}"]`).checked = true;
    }
    
    updateFilterState();
    filterProducts();
}

// Toggle filter group
function toggleFilterGroup(header) {
    header.classList.toggle('active');
}

// Initialize filter groups to be open
function initializeFilterGroups() {
    document.querySelectorAll('.filter-group-header').forEach(header => {
        header.classList.add('active');
    });
}

// Setup filter listeners
function setupFilterListeners() {
    // Price slider
    const priceSlider = document.getElementById('priceSlider');
    if (priceSlider) {
        priceSlider.addEventListener('input', function() {
            const maxPrice = parseInt(this.value);
            document.getElementById('maxPrice').value = maxPrice;
            document.getElementById('priceSliderValue').textContent = maxPrice;
            activeFilters.priceRange.max = maxPrice;
        });
    }
    
    // Price inputs
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    
    if (minPriceInput) {
        minPriceInput.addEventListener('change', function() {
            activeFilters.priceRange.min = parseInt(this.value) || 0;
        });
    }
    
    if (maxPriceInput) {
        maxPriceInput.addEventListener('change', function() {
            const max = parseInt(this.value) || 5000;
            activeFilters.priceRange.max = max;
            if (priceSlider) {
                priceSlider.value = max;
                document.getElementById('priceSliderValue').textContent = max;
            }
        });
    }
    
    // Filter checkboxes
    document.querySelectorAll('input[data-filter]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterState();
        });
    });
}

// Update filter state from checkboxes
function updateFilterState() {
    activeFilters.categories = [];
    activeFilters.ingredients = [];
    activeFilters.offers = [];
    
    document.querySelectorAll('input[data-filter="category"]:checked').forEach(cb => {
        if (cb.value !== 'all') {
            activeFilters.categories.push(cb.value);
        } else {
            activeFilters.categories = ['all'];
        }
    });
    
    document.querySelectorAll('input[data-filter="ingredient"]:checked').forEach(cb => {
        activeFilters.ingredients.push(cb.value);
    });
    
    document.querySelectorAll('input[data-filter="offer"]:checked').forEach(cb => {
        activeFilters.offers.push(cb.value);
    });
    
    updateFilterCount();
}

// Update filter count badge
function updateFilterCount() {
    const count = activeFilters.categories.filter(c => c !== 'all').length + 
                  activeFilters.ingredients.length + 
                  activeFilters.offers.length +
                  (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 5000 ? 1 : 0);
    
    const badge = document.getElementById('filterCount');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    }
}

// Apply filters
function applyFilters() {
    updateFilterState();
    filterProducts();
    if (window.innerWidth <= 1024) {
        toggleFilters();
    }
}

// Clear all filters
function clearAllFilters() {
    activeFilters = {
        categories: [],
        ingredients: [],
        priceRange: { min: 0, max: 5000 },
        offers: []
    };
    
    // Uncheck all checkboxes
    document.querySelectorAll('input[data-filter]').forEach(cb => {
        cb.checked = false;
    });
    
    // Check "all" category
    const allCategory = document.querySelector('input[data-filter="category"][value="all"]');
    if (allCategory) {
        allCategory.checked = true;
    }
    
    // Reset price inputs
    document.getElementById('minPrice').value = 0;
    document.getElementById('maxPrice').value = 5000;
    document.getElementById('priceSlider').value = 5000;
    document.getElementById('priceSliderValue').textContent = 5000;
    
    updateFilterState();
    filterProducts();
}

// Update active filter chips
function updateActiveFilterChips() {
    const container = document.getElementById('activeFilters');
    container.innerHTML = '';
    
    // Category chips
    activeFilters.categories.filter(c => c !== 'all').forEach(cat => {
        const chip = createFilterChip(cat, 'category', cat);
        container.appendChild(chip);
    });
    
    // Ingredient chips
    activeFilters.ingredients.forEach(ing => {
        const chip = createFilterChip(ing, 'ingredient', ing);
        container.appendChild(chip);
    });
    
    // Offer chips
    activeFilters.offers.forEach(offer => {
        const chip = createFilterChip(offer === 'best-seller' ? 'Best Seller' : offer, 'offer', offer);
        container.appendChild(chip);
    });
    
    // Price range chip
    if (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 5000) {
        const priceText = `₹${activeFilters.priceRange.min} - ₹${activeFilters.priceRange.max}`;
        const chip = createFilterChip(priceText, 'price', 'price');
        container.appendChild(chip);
    }
}

// Create filter chip
function createFilterChip(text, type, value) {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.innerHTML = `
        <span>${text}</span>
        <button class="filter-chip-remove" onclick="removeFilter('${type}', '${value}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    return chip;
}

// Remove filter
function removeFilter(type, value) {
    if (type === 'category') {
        activeFilters.categories = activeFilters.categories.filter(c => c !== value);
        document.querySelector(`input[data-filter="category"][value="${value}"]`).checked = false;
        if (activeFilters.categories.length === 0) {
            document.querySelector('input[data-filter="category"][value="all"]').checked = true;
            activeFilters.categories = ['all'];
        }
    } else if (type === 'ingredient') {
        activeFilters.ingredients = activeFilters.ingredients.filter(i => i !== value);
        document.querySelector(`input[data-filter="ingredient"][value="${value}"]`).checked = false;
    } else if (type === 'offer') {
        activeFilters.offers = activeFilters.offers.filter(o => o !== value);
        document.querySelector(`input[data-filter="offer"][value="${value}"]`).checked = false;
    } else if (type === 'price') {
        activeFilters.priceRange = { min: 0, max: 5000 };
        document.getElementById('minPrice').value = 0;
        document.getElementById('maxPrice').value = 5000;
        document.getElementById('priceSlider').value = 5000;
        document.getElementById('priceSliderValue').textContent = 5000;
    }
    
    updateFilterState();
    filterProducts();
}

// Toggle sort dropdown
function toggleSortDropdown() {
    document.querySelector('.sort-dropdown').classList.toggle('active');
}

// Close sort dropdown when clicking outside
document.addEventListener('click', function(event) {
    const sortDropdown = document.querySelector('.sort-dropdown');
    if (sortDropdown && !sortDropdown.contains(event.target)) {
        sortDropdown.classList.remove('active');
    }
});

// Sort products
function sortProducts(sortType, products = null) {
    currentSort = sortType;
    const productsToSort = products || allProducts;
    
    // Mark active sort option
    document.querySelectorAll('.sort-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector(`.sort-option[onclick*="'${sortType}'"]`)?.classList.add('active');
    
    // Sort logic
    switch(sortType) {
        case 'price-low':
            productsToSort.sort((a, b) => (parseFloat(a.PRICE) || 0) - (parseFloat(b.PRICE) || 0));
            break;
        case 'price-high':
            productsToSort.sort((a, b) => (parseFloat(b.PRICE) || 0) - (parseFloat(a.PRICE) || 0));
            break;
        case 'name':
            productsToSort.sort((a, b) => (a.NAME || '').localeCompare(b.NAME || ''));
            break;
        case 'best-seller':
            productsToSort.sort((a, b) => {
                const aBest = a.BEST_SELLER == 1 || a.BEST_SELLER === '1' ? 1 : 0;
                const bBest = b.BEST_SELLER == 1 || b.BEST_SELLER === '1' ? 1 : 0;
                return bBest - aBest;
            });
            break;
        case 'relevance':
        default:
            // Keep original order or relevance-based sorting
            break;
    }
    
    if (!products) {
        filterProducts();
    }
}

// View product details
function viewProduct(productId) {
    const product = allProducts.find(p => p.ID == productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const content = document.getElementById('productModalContent');
    const ingredients = product.INGREDIENTS || (product.BENEFITS ? product.BENEFITS.split(',').map(b => b.trim()) : []);
    const unit = product.UNIT || '1 unit';
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start;">
            <div>
                <img src="${product.IMAGE || 'https://via.placeholder.com/500x400'}" 
                     alt="${product.NAME}" 
                     style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);"
                     onerror="this.src='https://via.placeholder.com/500x400'">
            </div>
            <div>
                <div class="product-category" style="margin-bottom: 16px;">${product.CATEGORY || 'General'}</div>
                <h2 style="font-size: 2rem; margin-bottom: 16px; color: var(--text-dark);">${product.NAME}</h2>
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 24px;">
                    ₹${product.PRICE || 0} <span style="font-size: 1rem; color: var(--text-light);">/${unit}</span>
                </div>
                <p style="color: var(--text-light); margin-bottom: 24px; line-height: 1.8;">${product.DESCRIPTION || ''}</p>
                ${ingredients.length > 0 ? `
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 1.1rem; margin-bottom: 12px; color: var(--text-dark);">Natural Ingredients</h3>
                        <div class="ingredients-list">
                            ${ingredients.map(ing => `<span class="ingredient-tag">${ing}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${product.BENEFITS ? `
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 1.1rem; margin-bottom: 12px; color: var(--text-dark);">Benefits</h3>
                        <ul style="color: var(--text-light); line-height: 2;">
                            ${product.BENEFITS.split(',').map(b => `<li>${b.trim()}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 12px; margin-top: 32px;">
                    <button class="btn-action btn-add-cart" onclick="addToCart(${product.ID}, event); closeProductModal();" style="flex: 1; padding: 16px;">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="btn-action btn-add-cart" onclick="addToCart(${product.ID}, event); closeProductModal(); toggleCart();" style="flex: 1; padding: 16px;">
                        <i class="fas fa-bolt"></i> Buy Now
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Add to cart
function addToCart(productId, event) {
    if (event) event.stopPropagation();
    
    const product = allProducts.find(p => p.ID == productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.ID == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification('Product added to cart!');
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.ID != productId);
    saveCart();
    updateCartUI();
    showNotification('Product removed from cart');
}

// Update quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.ID == productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartUI();
    }
}

// Toggle cart sidebar
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

// Update cart UI
function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartBadge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Update badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        checkoutBtn.disabled = true;
        cartTotal.textContent = '₹0';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.IMAGE || 'https://via.placeholder.com/100'}" 
                     alt="${item.NAME}" 
                     class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/100'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.NAME}</div>
                    <div class="cart-item-price">₹${item.PRICE} × ${item.quantity} = ₹${item.PRICE * item.quantity}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateQuantity(${item.ID}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.ID}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${item.ID})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.PRICE * item.quantity), 0);
        cartTotal.textContent = `₹${total}`;
        checkoutBtn.disabled = false;
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('scalpsense_cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const saved = localStorage.getItem('scalpsense_cart');
    if (saved) {
        cart = JSON.parse(saved);
    }
    updateCartUI();
}

// Open checkout
function openCheckout() {
    if (cart.length === 0) return;
    
    const modal = document.getElementById('checkoutModal');
    const overlay = document.getElementById('checkoutOverlay');
    const body = document.getElementById('checkoutBody');
    
    const total = cart.reduce((sum, item) => sum + (item.PRICE * item.quantity), 0);
    const subtotal = total;
    const shipping = total > 999 ? 0 : 99;
    const finalTotal = subtotal + shipping;
    
    body.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px;">Order Summary</h3>
            ${cart.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                    <span>${item.NAME} × ${item.quantity}</span>
                    <span>₹${item.PRICE * item.quantity}</span>
                </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <span>Subtotal</span>
                <span>₹${subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 16px 0; font-size: 1.25rem; font-weight: 700;">
                <span>Total</span>
                <span style="color: var(--primary-color);">₹${finalTotal}</span>
            </div>
        </div>
        
        <form id="checkoutForm" onsubmit="processCheckout(event)">
            <h3 style="margin-bottom: 16px;">Shipping Information</h3>
            <div class="checkout-form-group">
                <label>Full Name *</label>
                <input type="text" required name="name" placeholder="Enter your full name">
            </div>
            <div class="checkout-form-group">
                <label>Email *</label>
                <input type="email" required name="email" placeholder="your.email@example.com">
            </div>
            <div class="checkout-form-group">
                <label>Phone Number *</label>
                <input type="tel" required name="phone" placeholder="+91 1234567890">
            </div>
            <div class="checkout-form-group">
                <label>Address *</label>
                <textarea required name="address" rows="3" placeholder="Enter your complete address"></textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="checkout-form-group">
                    <label>City *</label>
                    <input type="text" required name="city" placeholder="City">
                </div>
                <div class="checkout-form-group">
                    <label>Pincode *</label>
                    <input type="text" required name="pincode" placeholder="Pincode">
                </div>
            </div>
            
            <h3 style="margin: 32px 0 16px;">Payment Method</h3>
            <div class="checkout-form-group">
                <select required name="payment">
                    <option value="">Select payment method</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                </select>
            </div>
            
            <button type="submit" class="checkout-btn" style="width: 100%; margin-top: 24px;">
                <i class="fas fa-lock"></i> Place Order
            </button>
        </form>
    `;
    
    modal.style.display = 'block';
    overlay.classList.add('show');
}

// Close checkout
function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
    document.getElementById('checkoutOverlay').classList.remove('show');
}

// Process checkout
function processCheckout(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Here you would typically send this to your backend
    console.log('Checkout data:', data);
    console.log('Cart items:', cart);
    
    // Show success message
    alert('Order placed successfully! Your order will be delivered soon.');
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckout();
    showNotification('Order placed successfully!');
}

// Perform search
function performSearch(query) {
    const results = document.getElementById('searchResults');
    if (!query.trim()) {
        results.innerHTML = '';
        return;
    }
    
    const filtered = allProducts.filter(p => 
        (p.NAME || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.DESCRIPTION || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.CATEGORY || '').toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length === 0) {
        results.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-light);">No results found</p>';
    } else {
        results.innerHTML = filtered.slice(0, 5).map(product => `
            <div onclick="viewProduct(${product.ID}); document.getElementById('searchModal').style.display='none';" 
                 style="padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: var(--transition);"
                 onmouseover="this.style.background='var(--secondary-color)'"
                 onmouseout="this.style.background='white'">
                <div style="font-weight: 600; margin-bottom: 4px;">${product.NAME}</div>
                <div style="font-size: 0.9rem; color: var(--text-light);">${product.CATEGORY} • ₹${product.PRICE}</div>
            </div>
        `).join('');
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

