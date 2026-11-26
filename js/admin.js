/**
 * admin.js
 * Логика панели администратора.
 * Проверяет права доступа, загружает заявки и позволяет их модерировать.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const accessDenied = document.getElementById('access-denied');
    const adminPanel = document.getElementById('admin-panel');
    const applicationsList = document.getElementById('applications-list');
    const noApplications = document.getElementById('no-applications');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Проверяем авторизацию и права админа
    const currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    if (!currentUser || !currentUser.isAdmin) {
        // Нет доступа
        accessDenied.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        return;
    }

    // Показываем панель
    accessDenied.classList.add('hidden');
    adminPanel.classList.remove('hidden');

    let currentFilter = 'pending';
    let allApplications = [];

    // Загружаем все заявки
    loadApplications();

    async function loadApplications() {
        try {
            // Загружаем все проекты независимо от статуса
            const response = await fetch('/api/products?allStatuses=true');
            
            // Если API не поддерживает allStatuses, загружаем по отдельности
            // Для простоты — делаем один запрос и фильтруем на клиенте
            const pendingRes = await fetch('/api/products?status=pending');
            const approvedRes = await fetch('/api/products?status=approved');
            const rejectedRes = await fetch('/api/products?status=rejected');
            
            const pending = await pendingRes.json();
            const approved = await approvedRes.json();
            const rejected = await rejectedRes.json();
            
            allApplications = [...pending, ...approved, ...rejected];
            
            // Сортируем по дате (новые сверху)
            allApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Обновляем статистику
            document.getElementById('stat-pending').textContent = pending.length;
            document.getElementById('stat-approved').textContent = approved.length;
            document.getElementById('stat-rejected').textContent = rejected.length;

            renderApplications();
        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            applicationsList.innerHTML = '<p class="loading-text">Ошибка загрузки</p>';
        }
    }

    function renderApplications() {
        applicationsList.innerHTML = '';

        // Фильтруем по выбранному статусу
        let filtered = allApplications;
        if (currentFilter !== 'all') {
            filtered = allApplications.filter(app => app.status === currentFilter);
        }

        if (filtered.length === 0) {
            noApplications.classList.remove('hidden');
            return;
        }

        noApplications.classList.add('hidden');

        filtered.forEach(app => {
            const card = createApplicationCard(app);
            applicationsList.insertAdjacentHTML('beforeend', card);
        });

        // Навешиваем обработчики на кнопки
        attachActionHandlers();
    }

    function createApplicationCard(app) {
        const statusLabels = {
            'pending': '<span class="application-status status-pending">⏳ На модерации</span>',
            'approved': '<span class="application-status status-approved">✅ Одобрено</span>',
            'rejected': '<span class="application-status status-rejected">❌ Отклонено</span>'
        };

        const tagsHTML = (app.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('');
        
        const description = app.description ? `<p class="application-description">${app.description}</p>` : '';

        const buttonsHTML = app.status === 'pending' ? `
            <button class="btn-approve" data-id="${app._id}" data-action="approve">✅ Одобрить</button>
            <button class="btn-reject" data-id="${app._id}" data-action="reject">❌ Отклонить</button>
            <button class="btn-delete" data-id="${app._id}" data-action="delete" style="background:#6c757d; color:white; border:none; padding:10px 15px; border-radius:6px; font-family:var(--font-main); font-weight:600; cursor:pointer; margin-top:5px;">🗑️ Удалить</button>
        ` : `
            <button class="btn-approve" disabled style="opacity:0.5; cursor:not-allowed;">Уже обработано</button>
            <button class="btn-delete" data-id="${app._id}" data-action="delete" style="background:#6c757d; color:white; border:none; padding:10px 15px; border-radius:6px; font-family:var(--font-main); font-weight:600; cursor:pointer; margin-top:5px;">🗑️ Удалить</button>
        `;

        return `
            <div class="application-card" data-id="${app._id}">
                <img src="${app.image}" alt="${app.title}" class="application-image"
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="application-info">
                    <h3>${app.title}</h3>
                    <div class="application-meta">
                        <span>👤 ${app.authorName || 'Неизвестно'}</span>
                        <span>🏫 ${app.school}</span>
                        <span>💰 ${app.price} ₽</span>
                        <span>📂 ${getCategoryName(app.category)}</span>
                        <span>📅 ${new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    ${description}
                    ${tagsHTML ? `<div class="application-tags">${tagsHTML}</div>` : ''}
                    ${statusLabels[app.status] || ''}
                </div>
                <div class="application-actions">
                    ${buttonsHTML}
                </div>
            </div>
        `;
    }

    function attachActionHandlers() {
        document.querySelectorAll('.btn-approve, .btn-reject, .btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                const action = e.target.dataset.action;

                // Определяем действие
                let confirmMessage = '';
                if (action === 'approve') {
                    confirmMessage = 'Вы уверены, что хотите одобрить этот проект?';
                } else if (action === 'reject') {
                    confirmMessage = 'Вы уверены, что хотите отклонить этот проект?';
                } else if (action === 'delete') {
                    confirmMessage = 'Вы уверены, что хотите УДАЛИТЬ этот проект? Это действие нельзя отменить!';
                }

                if (!confirm(confirmMessage)) {
                    return;
                }

                e.target.disabled = true;
                const originalText = e.target.textContent;
                e.target.textContent = 'Обработка...';

                try {
                    const response = await fetch('/api/moderate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId,
                            action,
                            adminId: currentUser.id
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        if (action === 'delete') {
                            // Удаляем из локального массива
                            allApplications = allApplications.filter(a => a._id !== productId);
                            renderApplications();
                        } else {
                            // Обновляем статус
                            const app = allApplications.find(a => a._id === productId);
                            if (app) {
                                app.status = data.newStatus;
                            }
                            await loadApplications();
                        }
                        
                        alert(data.message);
                    } else {
                        throw new Error(data.error || 'Ошибка при модерации');
                    }
                } catch (error) {
                    console.error('Moderation error:', error);
                    alert('Ошибка: ' + error.message);
                    e.target.disabled = false;
                    e.target.textContent = originalText;
                }
            });
        });
    }

    // Обработчики фильтров
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderApplications();
        });
    });

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
        // === ЗАГРУЗКА ЗАКАЗОВ ===
    let allOrders = [];
    let currentOrderFilter = 'pending';

    async function loadOrders() {
        try {
            const response = await fetch('/api/orders?isAdmin=true');
            allOrders = await response.json();
            
            renderOrders();
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
        }
    }

    function renderOrders() {
        const ordersList = document.getElementById('orders-list');
        const noOrders = document.getElementById('no-orders');
        
        if (!ordersList) return;

        ordersList.innerHTML = '';

        let filtered = allOrders;
        if (currentOrderFilter !== 'all') {
            filtered = allOrders.filter(order => order.status === currentOrderFilter);
        }

        if (filtered.length === 0) {
            noOrders.classList.remove('hidden');
            return;
        }

        noOrders.classList.add('hidden');

        filtered.forEach(order => {
            const statusLabels = {
                'pending': '<span class="application-status status-pending">⏳ На рассмотрении</span>',
                'approved': '<span class="application-status status-approved">✅ Принят</span>',
                'rejected': '<span class="application-status status-rejected">❌ Отклонён</span>'
            };

            const commentHTML = order.comment ? `<p class="application-description">💬 ${order.comment}</p>` : '';

            const buttonsHTML = order.status === 'pending' ? `
                <button class="btn-approve" data-order-id="${order._id}" data-action="approve">✅ Принять</button>
                <button class="btn-reject" data-order-id="${order._id}" data-action="reject">❌ Отклонить</button>
            ` : `<button class="btn-approve" disabled>Обработано</button>`;

            const orderHTML = `
                <div class="application-card">
                    <div class="application-info" style="grid-column: 1 / -1;">
                        <h3>Заказ #${order._id.slice(-6)}</h3>
                        <div class="application-meta">
                            <span>👤 ${order.buyerName || 'Неизвестно'}</span>
                            <span>📞 ${order.contact}</span>
                            <span>📦 ${order.quantity} шт.</span>
                            <span>📅 ${new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        ${commentHTML}
                        ${statusLabels[order.status] || ''}
                    </div>
                    <div class="application-actions">
                        ${buttonsHTML}
                    </div>
                </div>
            `;
            ordersList.insertAdjacentHTML('beforeend', orderHTML);
        });

        // Навешиваем обработчики
        document.querySelectorAll('[data-order-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.orderId;
                const action = e.target.dataset.action;

                if (!confirm(`Вы уверены, что хотите ${action === 'approve' ? 'принять' : 'отклонить'} этот заказ?`)) {
                    return;
                }

                e.target.disabled = true;
                e.target.textContent = 'Обработка...';

                try {
                    const response = await fetch('/api/orders', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId,
                            action,
                            adminId: currentUser.id
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        await loadOrders();
                        alert(data.message);
                    } else {
                        throw new Error(data.error);
                    }
                } catch (error) {
                    alert('Ошибка: ' + error.message);
                    e.target.disabled = false;
                }
            });
        });
    }

    // Обработчики фильтров заказов
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.filter;
            renderOrders();
        });
    });

    // Загружаем заказы при загрузке страницы
    loadOrders();
});