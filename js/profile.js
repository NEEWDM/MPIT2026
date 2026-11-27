// авторизация, регистрация, личный кабинет и все что в нем

document.addEventListener('DOMContentLoaded', () => {
    
    // DOMики
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const logoutBtn = document.getElementById('logout-btn');

    // пользователь
    let currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    // переключить табы
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active-form'));
            btn.classList.add('active');
            const targetFormId = btn.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.getElementById(targetFormId).classList.add('active-form');
        });
    });

    // проверка на СЕССССИЮ
    if (currentUser) {
        showDashboard(currentUser);
    }

    // регистрация
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

    // вход
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

    // выход
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

    // личный кабинет отображурик
    function showDashboard(user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');

        document.getElementById('dash-name').textContent = user.name;
        document.getElementById('dash-school').textContent = `🏫 ${user.school}`;
        document.getElementById('dash-skills').innerHTML = `<span>${user.skills}</span>`;

        // и контакты
        displayContactsInProfile(user.contacts);

        // и проекты отрендерить
        renderMyProducts();

        const adminActions = document.getElementById('admin-actions');
        if (adminActions && user.isAdmin) {
            adminActions.style.display = 'block';
        } else if (adminActions) {
            adminActions.style.display = 'none';
        }
    }

    // отображение контактов
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

    // загрузка и рендер проектов
    async function renderMyProducts() {
        const grid = document.getElementById('my-products-grid');
        
        if (!currentUser || !currentUser.id) {
            grid.innerHTML = '<div class="empty-state">Пользователь не авторизован</div>';
            return;
        }

        grid.innerHTML = '<p>Загрузка...</p>';

        try {
            const response = await fetch('/api/products?userId=' + currentUser.id + '&allStatus=true');
            const myProducts = await response.json();

            grid.innerHTML = '';

            const approvedCount = myProducts.filter(p => p.status === 'approved').length;
            document.getElementById('stat-products').textContent = approvedCount;

            if (!myProducts || myProducts.length === 0) {
                grid.innerHTML = '<div class="empty-state">У вас пока нет загруженных работ. <a href="upload.html" style="color: var(--color-accent);">Начните продавать свои умения!</a></div>';
                return;
            }

            myProducts.forEach(product => {
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

                const productData = encodeURIComponent(JSON.stringify(product));

                const cardHTML = `
                    <article class="product-card ${cardClass}">
                        <img src="${product.image}" alt="${product.title}" class="product-image product-image-clickable"
                             data-product='${productData}'
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
            
            // обработчики на кликабельные изображения
            grid.querySelectorAll('.product-image-clickable').forEach(img => {
                // удалить стариков
                const newImg = img.cloneNode(true);
                img.parentNode.replaceChild(newImg, img);
                
                newImg.style.cursor = 'pointer';
                newImg.addEventListener('click', (e) => {
                    try {
                        const productData = JSON.parse(decodeURIComponent(e.currentTarget.dataset.product));
                        if (typeof openProductModal === 'function') {
                            openProductModal(productData, true);
                        }
                    } catch (error) {
                        console.error('Ошибка открытия модалки:', error);
                    }
                });
            });

        } catch (error) {
            console.error('Ошибка загрузки моих товаров:', error);
            grid.innerHTML = '<div class="empty-state">Не удалось загрузить товары</div>';
        }
    }

    // редактим контакты
    const editContactsBtn = document.getElementById('edit-contacts-btn');
    const contactsModal = document.getElementById('contacts-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const contactsForm = document.getElementById('contacts-form');
    const contactsMessage = document.getElementById('contacts-message');

    // открывашка модального окна
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

    // закрыть модальное окно
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

    // отправить форму контактов
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

            // убрать пробелы
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
        // загрузка моих заказов(тут что то неладное)
    async function renderMyOrders() {
        const ordersGrid = document.getElementById('my-orders-grid');
        
        //if (!ordersGrid) return; проверка
        
        if (!currentUser || !currentUser.id) {
            ordersGrid.innerHTML = '<div class="orders-empty">Пользователь не авторизован</div>';
            return;
        }

        ordersGrid.innerHTML = '<p>Загрузка заказов...</p>';

        try {
            const response = await fetch('/api/orders?userId=' + currentUser.id);
            const myOrders = await response.json();

            ordersGrid.innerHTML = '';

            if (!myOrders || myOrders.length === 0) {
                ordersGrid.innerHTML = '<div class="orders-empty">У вас пока нет заказов</div>';
                return;
            }

            myOrders.forEach(order => {
                const statusLabels = {
                    'pending': '<span class="order-status-badge order-status-pending">⏳ На рассмотрении...</span>',
                    'approved': '<span class="order-status-badge order-status-approved">✅ Принят</span>',
                    'rejected': '<span class="order-status-badge order-status-rejected">❌ Отклонён</span>'
                };

                const commentHTML = order.comment ? `<div class="order-card-comment">💬 ${order.comment}</div>` : '';

                const orderHTML = `
                    <div class="order-card">
                        <div class="order-card-header">
                            <div>
                                <div class="order-card-title">Заказ #${order._id.slice(-6)}</div>
                                <div class="order-card-date">${new Date(order.createdAt).toLocaleDateString('ru-RU')}</div>
                            </div>
                            ${statusLabels[order.status] || ''}
                        </div>
                        <div class="order-card-details">
                            <div class="order-detail-item">
                                <span class="order-detail-label">Контакт</span>
                                <span class="order-detail-value">${order.contact}</span>
                            </div>
                            <div class="order-detail-item">
                                <span class="order-detail-label">Количество</span>
                                <span class="order-detail-value">${order.quantity} шт.</span>
                            </div>
                        </div>
                        ${commentHTML}
                    </div>
                `;
                ordersGrid.insertAdjacentHTML('beforeend', orderHTML);
            });
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            ordersGrid.innerHTML = '<div class="orders-empty">Не удалось загрузить заказы</div>';
        }
    }

    // загрузка заказов когда дэшборд открыли
    const originalShowDashboard = showDashboard;
    showDashboard = function(user) {
        originalShowDashboard(user);
        renderMyOrders();
    };
});