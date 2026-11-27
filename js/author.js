//автор и работы по айди

document.addEventListener('DOMContentLoaded', () => {
    
    const loadingState = document.getElementById('author-loading');
    const errorState = document.getElementById('author-error');
    const authorProfile = document.getElementById('author-profile');
    const authorName = document.getElementById('author-name');
    const authorSchool = document.getElementById('author-school');
    const authorSkills = document.getElementById('author-skills');
    const authorContactsList = document.getElementById('author-contacts-list');
    const authorProductsGrid = document.getElementById('author-products-grid');
    const noProducts = document.getElementById('no-products');

    // айди из юрл
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        showError();
        return;
    }

    // загрузка данных автора
    loadAuthorProfile(userId);

    async function loadAuthorProfile(userId) {
        try {
            // все еще загрузка
            const userResponse = await fetch(`/api/user?id=${userId}`);
            const userData = await userResponse.json();

            if (!userResponse.ok || !userData) {
                showError();
                return;
            }

            // еще загрузка
            const productsResponse = await fetch(`/api/products?userId=${userId}`);
            const products = await productsResponse.json();

            // отображение профиля
            displayAuthorProfile(userData, products);

        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            showError();
        }
    }

    function displayAuthorProfile(user, products) {
        loadingState.classList.add('hidden');
        authorProfile.classList.remove('hidden');

        // заполнение данных
        authorName.textContent = user.name;
        authorSchool.textContent = `🏫 ${user.school}`;
        
        // первая буковка
        document.getElementById('author-avatar-letter').textContent = user.name.charAt(0).toUpperCase();

        // навыки
        if (user.skills) {
            authorSkills.innerHTML = `<span>${getCategoryName(user.skills)}</span>`;
        }

        // контакты
        displayContacts(user.contacts);

        // проекты
        displayProducts(products);
    }

    function displayContacts(contacts) {
        authorContactsList.innerHTML = '';

        if (!contacts || Object.keys(contacts).length === 0) {
            authorContactsList.innerHTML = '<div class="no-contacts">Автор не указал контакты</div>';
            return;
        }

        const contactTypes = {
            email: { icon: '📧', label: 'Email' },
            phone: { icon: '📱', label: 'Телефон' },
            telegram: { icon: '✈️', label: 'Telegram' },
            vk: { icon: '🔵', label: 'ВКонтакте' }
        };

        for (const [key, value] of Object.entries(contacts)) {
            if (!value) continue;

            const contactInfo = contactTypes[key] || { icon: '📌', label: key };
            
            let valueHTML = value;
            if (key === 'email') {
                valueHTML = `<a href="mailto:${value}">${value}</a>`;
            } else if (key === 'phone') {
                valueHTML = `<a href="tel:${value}">${value}</a>`;
            } else if (key === 'telegram') {
                valueHTML = `<a href="https://t.me/${value.replace('@', '')}" target="_blank">${value}</a>`;
            } else if (key === 'vk') {
                valueHTML = `<a href="${value}" target="_blank">Профиль VK</a>`;
            }

            const contactHTML = `
                <div class="contact-item">
                    <div class="contact-icon">${contactInfo.icon}</div>
                    <div>
                        <div class="contact-label">${contactInfo.label}</div>
                        <div class="contact-value">${valueHTML}</div>
                    </div>
                </div>
            `;
            authorContactsList.insertAdjacentHTML('beforeend', contactHTML);
        }
    }

    function displayProducts(products) {
        authorProductsGrid.innerHTML = '';

        if (!products || products.length === 0) {
            noProducts.classList.remove('hidden');
            return;
        }

        noProducts.classList.add('hidden');

        products.forEach(product => {
            const productData = encodeURIComponent(JSON.stringify(product));
            
            const cardHTML = `
                <article class="product-card">
                    <img src="${product.image}" alt="${product.title}" class="product-image product-image-clickable"
                         data-product='${productData}'
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <div class="product-info">
                        <div class="product-category">${getCategoryName(product.category)}</div>
                        <h3 class="product-title">${product.title}</h3>
                        <div class="product-meta">
                            <span class="product-price">${product.price} ₽</span>
                            <span class="product-school">🏫 ${product.school}</span>
                        </div>
                    </div>
                </article>
            `;
            authorProductsGrid.insertAdjacentHTML('beforeend', cardHTML);
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
    }

    function showError() {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

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
});