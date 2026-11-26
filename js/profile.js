/**
 * profile.js
 * Управление авторизацией, регистрацией и личным кабинетом.
 * Работает с MongoDB через Vercel API (/api/auth и /api/products).
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // === ЭЛЕМЕНТЫ DOM ===
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const logoutBtn = document.getElementById('logout-btn');

    // === ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ (из localStorage) ===
    let currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    // === ПЕРЕКЛЮЧЕНИЕ ТАБОВ (Вход / Регистрация) ===
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active-form'));
            btn.classList.add('active');
            const targetFormId = btn.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.getElementById(targetFormId).classList.add('active-form');
        });
    });

    // === ПРОВЕРКА СЕССИИ ПРИ ЗАГРУЗКЕ ===
    if (currentUser) {
        showDashboard(currentUser);
    }

    // === РЕГИСТРАЦИЯ ===
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    name: document.getElementById('reg-name').value,
                    school: document.getElementById('reg-school').value,
                    email: document.getElementById('reg-email').value,
                    password: document.getElementById('reg-pass').value,
                    skills: document.getElementById('reg-skills').value,
                    contacts: {
                        email: document.getElementById('reg-email-contact').value,
                        phone: document.getElementById('reg-phone').value,
                        telegram: document.getElementById('reg-telegram').value
                    }
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('tuscul_user', JSON.stringify(currentUser));
                showDashboard(currentUser);
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            alert('Ошибка соединения: ' + error.message);
        }
    });

    // === ВХОД ===
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email: e.target.querySelector('input[type="text"]').value,
                    password: e.target.querySelector('input[type="password"]').value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('tuscul_user', JSON.stringify(currentUser));
                showDashboard(currentUser);
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            alert('Ошибка соединения: ' + error.message);
        }
    });

    // === ВЫХОД ===
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('tuscul_user');
            currentUser = null;
            authSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            document.getElementById('login-form').reset();
            document.getElementById('register-form').reset();
        });
    }

    // === ОТОБРАЖЕНИЕ ЛИЧНОГО КАБИНЕТА ===
    function showDashboard(user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');

        document.getElementById('dash-name').textContent = user.name;
        document.getElementById('dash-school').textContent = `🏫 ${user.school}`;
        document.getElementById('dash-skills').innerHTML = `<span>${user.skills}</span>`;

        // Загружаем и отображаем товары пользователя
        renderMyProducts();
    }

    // === ЗАГРУЗКА И РЕНДЕР МОИХ ТОВАРОВ ИЗ БД ===
    async function renderMyProducts() {
        const grid = document.getElementById('my-products-grid');
        
        if (!currentUser || !currentUser.id) {
            grid.innerHTML = '<div class="empty-state">Пользователь не авторизован</div>';
            return;
        }

        grid.innerHTML = '<p>Загрузка...</p>';

        try {
            const response = await fetch('/api/products?userId=' + currentUser.id);
            const myProducts = await response.json();

            grid.innerHTML = '';

            if (!myProducts || myProducts.length === 0) {
                grid.innerHTML = '<div class="empty-state">У вас пока нет загруженных работ. <a href="upload.html" style="color: var(--color-accent);">Начните продавать свои умения!</a></div>';
                return;
            }

            myProducts.forEach(product => {
                const cardHTML = `
                    <article class="product-card">
                        <img src="${product.image}" alt="${product.title}" class="product-image"
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
                grid.insertAdjacentHTML('beforeend', cardHTML);
            });
        } catch (error) {
            console.error('Ошибка загрузки моих товаров:', error);
            grid.innerHTML = '<div class="empty-state">Не удалось загрузить товары</div>';
        }
    }

    // === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: НАЗВАНИЯ КАТЕГОРИЙ ===
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