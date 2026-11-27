/**
 * catalog.js
 * Логика страницы каталога с фильтрацией и сортировкой.
 * Загружает проекты из MongoDB через API с параметрами фильтра.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const filtersForm = document.getElementById('filters-form');
    const resetBtn = document.getElementById('reset-filters');
    const catalogGrid = document.getElementById('catalog-grid');
    const resultsCount = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    const sortSelect = document.getElementById('sort-select');

    let allProducts = []; // Все загруженные проекты
    let filteredProducts = []; // Отфильтрованные проекты

    // === ЗАГРУЗКА ПРОЕКТОВ ИЗ БД ===
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            allProducts = await response.json();
            filteredProducts = [...allProducts];
            
            renderProducts(filteredProducts);
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            catalogGrid.innerHTML = '<p>Не удалось загрузить проекты</p>';
        }
    }

    // === РЕНДЕР КАРТОЧЕК ===
    function renderProducts(products) {
        catalogGrid.innerHTML = '';

        if (products.length === 0) {
            catalogGrid.classList.add('hidden');
            noResults.classList.remove('hidden');
            resultsCount.textContent = 'Найдено: 0';
            return;
        }

        catalogGrid.classList.remove('hidden');
        noResults.classList.add('hidden');
        resultsCount.textContent = `Найдено: ${products.length}`;

        products.forEach(product => {
            const authorLink = product.userId ? `author.html?id=${product.userId}` : '#';
            const productData = encodeURIComponent(JSON.stringify(product));
            
            const cardHTML = `
                <article class="product-card">
                    <img src="${product.image}" alt="${product.title}" class="product-image product-image-clickable"
                         data-product='${productData}'
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <div class="product-info">
                        <div class="product-category">${getCategoryName(product.category)}</div>
                        <h3 class="product-title">${product.title}</h3>
                        <p class="product-author">
                            👤 <a href="${authorLink}" class="author-link">${product.authorName || 'Неизвестно'}</a>
                        </p>
                        <div class="product-meta">
                            <span class="product-price">${product.price} ₽</span>
                            <span class="product-school">🏫 ${product.school}</span>
                        </div>
                        <button class="btn btn-primary buy-button" style="width:100%; margin-top:15px;"
                                data-id="${product._id}" 
                                data-title="${product.title}" 
                                data-price="${product.price}">
                            Купить
                        </button>
                    </div>
                </article>
            `;
            catalogGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        // Обработчики на кликабельные изображения
        document.querySelectorAll('.product-image-clickable').forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                try {
                    const productData = JSON.parse(decodeURIComponent(e.target.dataset.product));
                    if (typeof openProductModal === 'function') {
                        openProductModal(productData);
                    }
                } catch (error) {
                    console.error('Ошибка открытия модалки:', error);
                }
            });
        });

        // Обработчики на кнопки "Купить"
        document.querySelectorAll('.buy-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const title = e.target.dataset.title;
                const price = parseInt(e.target.dataset.price);
                
                if (typeof openOrderModal === 'function') {
                    openOrderModal(id, title, price);
                }
            });
        });
    }

    // фильтрование
    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

    // сортирование
    sortSelect.addEventListener('change', () => {
        applyFilters();
    });

    // сброс фильтров
    resetBtn.addEventListener('click', () => {
        filtersForm.reset();
        applyFilters();
    });

    function applyFilters() {
        const search = document.getElementById('filter-search').value.toLowerCase().trim();
        const category = document.getElementById('filter-category').value;
        const school = document.getElementById('filter-school').value.toLowerCase().trim();
        const author = document.getElementById('filter-author').value.toLowerCase().trim();
        const priceMin = parseInt(document.getElementById('filter-price-min').value) || 0;
        const priceMax = parseInt(document.getElementById('filter-price-max').value) || Infinity;
        const sort = sortSelect.value;

        // фильтрование
        filteredProducts = allProducts.filter(product => {
            // по словам
            if (search) {
                const searchIn = `${product.title} ${product.description || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
                if (!searchIn.includes(search)) return false;
            }

            // категориям
            if (category && product.category !== category) return false;

            // школам
            if (school && !product.school.toLowerCase().includes(school)) return false;

            // авторам
            if (author && !product.authorName.toLowerCase().includes(author)) return false;

            // цене
            if (product.price < priceMin || product.price > priceMax) return false;

            return true;
        });

        // сортирование
        if (sort === 'price-asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else {
            // сначала новых
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        renderProducts(filteredProducts);
    }

    // полезность
    function getCategoryName(code) {
        const names = {
            '3d_print': '3D Печать',
            'robotics': 'Робототехника',
            'woodwork': 'Дерево',
            'metalwork': 'Металл',
            'souvenirs': 'Сувениры',
            'digital': 'Цифровой проект',
            'crafts': 'Поделки'
        };
        return names[code] || code;
    }
        // обработчики на тыкательное
        catalogGrid.querySelectorAll('.product-image-clickable').forEach(img => {
            const newImg = img.cloneNode(true);
            img.parentNode.replaceChild(newImg, img);
            
            newImg.style.cursor = 'pointer';
            newImg.addEventListener('click', (e) => {
                try {
                    const productData = JSON.parse(decodeURIComponent(e.currentTarget.dataset.product));
                    if (typeof openProductModal === 'function') {
                        openProductModal(productData);
                    }
                } catch (error) {
                    console.error('Ошибка открытия модалки:', error);
                }
            });
        });

    // уже не нужно, я умный
    /*window.addToCart = function(productId) {
        const cartCount = document.getElementById('cart-count');
        let currentCount = parseInt(cartCount.innerText);
        cartCount.innerText = currentCount + 1;
        alert(`Товар добавлен в корзину!`);
    };*/

    // загрузка проектов
    loadProducts();
});