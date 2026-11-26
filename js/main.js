document.addEventListener('DOMContentLoaded', () => {
    
        // --- 1. ЗАГРУЗКА ТОВАРОВ ИЗ MONGODB ЧЕРЕЗ VERCEL API ---
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const productsDB = await response.json();
            
            renderProducts(productsDB);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            document.getElementById('products-grid').innerHTML = 
                '<p>Не удалось загрузить товары. Попробуйте позже.</p>';
        }
    }
    
    loadProducts();

    // рендер
            function renderProducts(products) {
        const gridContainer = document.getElementById('products-grid');
        gridContainer.innerHTML = '';

        if (!products || products.length === 0) {
            gridContainer.innerHTML = '<p>Товары пока не добавлены.</p>';
            return;
        }

        // Ограничиваем до 6 проектов для главной страницы
        const limitedProducts = products.slice(0, 6);

        limitedProducts.forEach(product => {
            const cardHTML = `
                <article class="product-card">
                    <img src="${product.image}" alt="${product.title}" class="product-image" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <h3 class="product-title">${product.title}</h3>
                        <div class="product-meta">
                            <span class="product-price">${product.price} ₽</span>
                            <span class="product-school">🏫 ${product.school}</span>
                        </div>
                        <button class="btn btn-primary" style="width:100%; margin-top:15px;" 
                                onclick="addToCart(${product._id})">
                            В корзину
                        </button>
                    </div>
                </article>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // тут типо в корзину добавляем, но нет
    window.addToCart = function(id) {
        const cartCount = document.getElementById('cart-count');
        let currentCount = parseInt(cartCount.innerText);
        cartCount.innerText = currentCount + 1;
        
        // смешная вылезалка
        alert(`Товар с ID ${id} добавлен в корзину`)
    };

    // рендер вызываем
    renderProducts(productsDB);
});