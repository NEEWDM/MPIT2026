//товары из бд на главную

document.addEventListener('DOMContentLoaded', () => {
    
    // === загрузка из mongodb ===
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

        // макс 6
        const limitedProducts = products.slice(0, 6);

        limitedProducts.forEach(product => {
            const authorLink = product.userId ? `author.html?id=${product.userId}` : '#';
            
            const cardHTML = `
                <article class="product-card">
                    <img src="${product.image}" alt="${product.title}" class="product-image" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <h3 class="product-title">${product.title}</h3>
                        <p class="product-author">
                            👤 <a href="${authorLink}" class="author-link">${product.authorName || 'Неизвестно'}</a>
                        </p>
                        <div class="product-meta">
                            <span class="product-price">${product.price} ₽</span>
                            <span class="product-school">🏫 ${product.school}</span>
                        </div>
                        <button class="btn btn-primary buy-button" 
                                data-id="${product._id}" 
                                data-title="${product.title}" 
                                data-price="${product.price}"
                                style="width:100%; margin-top:15px;">
                            Купить
                        </button>
                    </div>
                </article>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        // навешивание обработчиков на "купить"
        document.querySelectorAll('.buy-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const title = e.target.dataset.title;
                const price = parseInt(e.target.dataset.price);
                
                if (typeof openOrderModal === 'function') {
                    openOrderModal(id, title, price);
                } else {
                    alert('Ошибка: функция покупки не загружена');
                }
            });
        });
    }

    // снова не нужно, я умный
    /*window.addToCart = function(id) {
        const cartCount = document.getElementById('cart-count');
        let currentCount = parseInt(cartCount.innerText);
        cartCount.innerText = currentCount + 1;
        alert(`Товар ID ${id} добавлен в корзину!`);
    };*/
});