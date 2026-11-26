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

                if (user.contacts) {
            displayContactsInProfile(user.contacts);
        }
        
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
        // === РЕДАКТИРОВАНИЕ КОНТАКТОВ ===
    const editContactsBtn = document.getElementById('edit-contacts-btn');
    const contactsModal = document.getElementById('contacts-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const contactsForm = document.getElementById('contacts-form');
    const contactsMessage = document.getElementById('contacts-message');

    // Открыть модальное окно
    if (editContactsBtn) {
        editContactsBtn.addEventListener('click', () => {
            // Заполняем форму текущими контактами
            if (currentUser && currentUser.contacts) {
                document.getElementById('edit-email').value = currentUser.contacts.email || '';
                document.getElementById('edit-phone').value = currentUser.contacts.phone || '';
                document.getElementById('edit-telegram').value = currentUser.contacts.telegram || '';
                document.getElementById('edit-vk').value = currentUser.contacts.vk || '';
            }
            
            contactsModal.classList.remove('hidden');
            contactsMessage.classList.add('hidden');
        });
    }

    // Закрыть модальное окно
    function closeModal() {
        contactsModal.classList.add('hidden');
        contactsForm.reset();
        contactsMessage.classList.add('hidden');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeModal);
    }

    // Закрытие по клику вне модального окна
    if (contactsModal) {
        contactsModal.addEventListener('click', (e) => {
            if (e.target === contactsModal) {
                closeModal();
            }
        });
    }

    // Отправка формы
    if (contactsForm) {
        contactsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUser || !currentUser.id) {
                showContactsMessage('Пользователь не авторизован', 'error');
                return;
            }

            const newContacts = {
                email: document.getElementById('edit-email').value.trim(),
                phone: document.getElementById('edit-phone').value.trim(),
                telegram: document.getElementById('edit-telegram').value.trim(),
                vk: document.getElementById('edit-vk').value.trim()
            };

            // Убираем пустые поля
            Object.keys(newContacts).forEach(key => {
                if (!newContacts[key]) delete newContacts[key];
            });

            try {
                const response = await fetch('/api/update-contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        contacts: newContacts
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Обновляем currentUser в localStorage
                    currentUser.contacts = newContacts;
                    localStorage.setItem('tuscul_user', JSON.stringify(currentUser));
                    
                    showContactsMessage('✓ Контакты обновлены', 'success');
                    
                    // Обновляем отображение контактов в профиле
                    displayContactsInProfile(newContacts);
                    
                    // Закрываем модалку через 1.5 секунды
                    setTimeout(closeModal, 1500);
                } else {
                    throw new Error(data.error || 'Ошибка при сохранении');
                }
            } catch (error) {
                console.error('Update contacts error:', error);
                showContactsMessage('Ошибка: ' + error.message, 'error');
            }
        });
    }

    // Отображение контактов в профиле
    function displayContactsInProfile(contacts) {
        let contactsContainer = document.querySelector('.user-contacts');
        
        if (!contactsContainer) {
            // Создаём контейнер, если его нет
            contactsContainer = document.createElement('div');
            contactsContainer.className = 'user-contacts';
            document.querySelector('.user-info').appendChild(contactsContainer);
        }

        if (!contacts || Object.keys(contacts).length === 0) {
            contactsContainer.innerHTML = '<h4>📞 Контакты</h4><p style="color:#999; font-size:0.9rem;">Не указаны</p>';
            return;
        }

        let contactsHTML = '<h4>📞 Контакты</h4>';
        
        if (contacts.email) {
            contactsHTML += `<div class="contact-item-small">📧 <a href="mailto:${contacts.email}">${contacts.email}</a></div>`;
        }
        if (contacts.phone) {
            contactsHTML += `<div class="contact-item-small">📱 <a href="tel:${contacts.phone}">${contacts.phone}</a></div>`;
        }
        if (contacts.telegram) {
            contactsHTML += `<div class="contact-item-small">✈️ <a href="https://t.me/${contacts.telegram.replace('@', '')}" target="_blank">${contacts.telegram}</a></div>`;
        }
        if (contacts.vk) {
            contactsHTML += `<div class="contact-item-small">🔵 <a href="${contacts.vk}" target="_blank">Профиль VK</a></div>`;
        }

        contactsContainer.innerHTML = contactsHTML;
    }

    // Сообщение в модальном окне
    function showContactsMessage(text, type) {
        contactsMessage.textContent = text;
        contactsMessage.className = 'form-message ' + type;
        contactsMessage.classList.remove('hidden');
    }

    // Загружаем контакты при открытии профиля
    if (currentUser && currentUser.contacts) {
        displayContactsInProfile(currentUser.contacts);
    }
});