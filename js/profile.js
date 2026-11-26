/**
 * profile.js
 * Управление авторизацией, регистрацией, личным кабинетом и контактами.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // === ЭЛЕМЕНТЫ DOM ===
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const logoutBtn = document.getElementById('logout-btn');

    // === ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ===
    let currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    // === ПЕРЕКЛЮЧЕНИЕ ТАБОВ ===
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active-form'));
            btn.classList.add('active');
            const targetFormId = btn.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.getElementById(targetFormId).classList.add('active-form');
        });
    });

    // === ПРОВЕРКА СЕССИИ ===
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
                    },
                    adminCode: document.getElementById('reg-admin-code').value
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

        // Отображаем контакты
        displayContactsInProfile(user.contacts);

        // Загружаем товары
        renderMyProducts();

        const adminActions = document.getElementById('admin-actions');
        if (adminActions && user.isAdmin) {
            adminActions.style.display = 'block';
        } else if (adminActions) {
            adminActions.style.display = 'none';
        }
    }

    // === ОТОБРАЖЕНИЕ КОНТАКТОВ В ПРОФИЛЕ ===
    function displayContactsInProfile(contacts) {
        const contactsContainer = document.getElementById('dash-contacts');
        
        if (!contactsContainer) return;

        if (!contacts || Object.keys(contacts).length === 0) {
            contactsContainer.innerHTML = '<p style="color:#999; font-size:0.9rem; margin-top:10px;">Контакты не указаны</p>';
            return;
        }

        let contactsHTML = '<h4 style="margin-top:15px; margin-bottom:10px; font-size:0.95rem; color:#666;">📞 Контакты</h4>';
        
        if (contacts.email) {
            contactsHTML += `<div style="margin-bottom:8px; font-size:0.9rem;">📧 <a href="mailto:${contacts.email}" style="color:var(--color-accent); text-decoration:none;">${contacts.email}</a></div>`;
        }
        if (contacts.phone) {
            contactsHTML += `<div style="margin-bottom:8px; font-size:0.9rem;">📱 <a href="tel:${contacts.phone}" style="color:var(--color-accent); text-decoration:none;">${contacts.phone}</a></div>`;
        }
        if (contacts.telegram) {
            contactsHTML += `<div style="margin-bottom:8px; font-size:0.9rem;">✈️ <a href="https://t.me/${contacts.telegram.replace('@', '')}" target="_blank" style="color:var(--color-accent); text-decoration:none;">${contacts.telegram}</a></div>`;
        }
        if (contacts.vk) {
            contactsHTML += `<div style="margin-bottom:8px; font-size:0.9rem;">🔵 <a href="${contacts.vk}" target="_blank" style="color:var(--color-accent); text-decoration:none;">Профиль VK</a></div>`;
        }

        contactsContainer.innerHTML = contactsHTML;
    }

    // === ЗАГРУЗКА И РЕНДЕР МОИХ ТОВАРОВ ===
    async function renderMyProducts() {
        const grid = document.getElementById('my-products-grid');
        
        if (!currentUser || !currentUser.id) {
            grid.innerHTML = '<div class="empty-state">Пользователь не авторизован</div>';
            return;
        }

        grid.innerHTML = '<p>Загрузка...</p>';

        try {
            // Запрашиваем ВСЕ проекты пользователя (включая pending и rejected)
            const response = await fetch('/api/products?userId=' + currentUser.id + '&allStatus=true');
            const myProducts = await response.json();

            grid.innerHTML = '';

            // Считаем только одобренные для статистики
            const approvedCount = myProducts.filter(p => p.status === 'approved').length;
            document.getElementById('stat-products').textContent = approvedCount;

            if (!myProducts || myProducts.length === 0) {
                grid.innerHTML = '<div class="empty-state">У вас пока нет загруженных работ. <a href="upload.html" style="color: var(--color-accent);">Начните продавать свои умения!</a></div>';
                return;
            }

            myProducts.forEach(product => {
                // Определяем статус и стиль
                let statusBadge = '';
                let cardClass = '';
                
                if (product.status === 'pending') {
                    statusBadge = '<span class="status-badge status-pending">⏳ На модерации</span>';
                    cardClass = 'product-card-pending';
                } else if (product.status === 'approved') {
                    statusBadge = '<span class="status-badge status-approved">✅ Опубликовано</span>';
                    cardClass = '';
                } else if (product.status === 'rejected') {
                    statusBadge = '<span class="status-badge status-rejected">❌ Отклонено</span>';
                    cardClass = 'product-card-rejected';
                }

                const cardHTML = `
                    <article class="product-card ${cardClass}">
                        <img src="${product.image}" alt="${product.title}" class="product-image"
                             onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                        <div class="product-info">
                            ${statusBadge}
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

    if (contactsModal) {
        contactsModal.addEventListener('click', (e) => {
            if (e.target === contactsModal) {
                closeModal();
            }
        });
    }

    // Отправка формы контактов
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
                    currentUser.contacts = newContacts;
                    localStorage.setItem('tuscul_user', JSON.stringify(currentUser));
                    
                    showContactsMessage('✓ Контакты обновлены', 'success');
                    displayContactsInProfile(newContacts);
                    
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

    function showContactsMessage(text, type) {
        contactsMessage.textContent = text;
        contactsMessage.className = 'form-message ' + type;
        contactsMessage.classList.remove('hidden');
    }

    // === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ===
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