document.addEventListener('DOMContentLoaded', () => {
    
    // Типо база данных
    const productsDB = [
        {
            id: 1,
            title: "Портрет Путина на дереве",
            category: "Дерево",
            price: 200,
            school: "НБСОШ2",
            image: "images/products/picture1.jpg" 
        },
        {
            id: 2,
            title: "Шестерня для насоса",
            category: "3D Печать",
            price: 350,
            school: "IT-Cube",
            image: "images/products/picture2.jpg"
        },
        {
            id: 3,
            title: "Чороон(жоский)",
            category: "Сувениры",
            price: 1500,
            school: "Кружок 'Чороонология'",
            image: "images/products/picture3.jpg"
        },
        {
            id: 4,
            title: "Брелок с логотипом школы",
            category: "Сувениры",
            price: 150,
            school: "СОШ имени Сорокина И.Н.",
            image: "images/products/picture4.jpg"
        },
        {
            id: 5,
            title: "Фигурка 'Крипер'",
            category: "3D Печать",
            price: 450,
            school: "Секция Анонимных Печатистов",
            image: "images/products/picture5.jpg"
        },
        {
            id: 6,
            title: "Сайт FS 'Тускул'",
            category: "Цифровой проект",
            price: 15,
            school: "IT-Cube",
            image: "images/products/picture6.jpg"
        },
    ];

    // рендер
    function renderProducts(products) {
        const gridContainer = document.getElementById('products-grid');
        
        // чтоб не наслаивалось
        gridContainer.innerHTML = '';

        products.forEach(product => {
            // структура карточки
            const cardHTML = `
                <article class="product-card">
                    <div class="card-image-wrapper">
                        <img src="${product.image}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <h3 class="product-title">${product.title}</h3>
                        <div class="product-meta">
                            <span class="product-price">${product.price} ₽</span>
                            <span class="product-school">🏫 ${product.school}</span>
                        </div>
                        <button class="btn btn-primary" style="width:100%; margin-top:15px;" onclick="addToCart(${product.id})">
                            В корзину
                        </button>
                    </div>
                </article>
            `;
            
            // в сетку
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