//логика админстраторской панели

document.addEventListener('DOMContentLoaded', () => {
    
    const accessDenied = document.getElementById('access-denied');
    const adminPanel = document.getElementById('admin-panel');
    const applicationsList = document.getElementById('applications-list');
    const noApplications = document.getElementById('no-applications');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // перепроверка на админоподобность
    const currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    if (!currentUser || !currentUser.isAdmin) {
        // отказано
        accessDenied.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        return;
    }

    // показывание панели
    accessDenied.classList.add('hidden');
    adminPanel.classList.remove('hidden');

    let currentFilter = 'pending';
    let allApplications = [];

    // загружение заявок
    loadApplications();

    async function loadApplications() {
        try {
            // загрузка всего
            const response = await fetch('/api/products?allStatuses=true');
            
            // фильтрование по аллстатус
            const pendingRes = await fetch('/api/products?status=pending');
            const approvedRes = await fetch('/api/products?status=approved');
            const rejectedRes = await fetch('/api/products?status=rejected');
            
            const pending = await pendingRes.json();
            const approved = await approvedRes.json();
            const rejected = await rejectedRes.json();
            
            allApplications = [...pending, ...approved, ...rejected];
            
            // сортировка по новизне
            allApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // обновление статистики
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

        // фильтр по статусу
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

        // кнопкам присваевание обработчиков
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
        // события на контейнер делегируем
        const applicationsList = document.getElementById('applications-list');
        
        if (!applicationsList) return;

        applicationsList.addEventListener('click', async (e) => {
            // на случай кнопки в кнопке
            const btn = e.target.closest('.btn-approve, .btn-reject, .btn-delete');
            
            if (!btn) return;
            
            // игнор выключенного
            if (btn.disabled) return;

            const productId = btn.dataset.id;
            const action = btn.dataset.action;

            if (!productId || !action) return;

            // сообщение УВЕРЕНЫЫЫЫ?
            let confirmMessage = '';
            if (action === 'approve') {
                confirmMessage = 'Вы уверены, что хотите одобрить этот проект?';
            } else if (action === 'reject') {
                confirmMessage = 'Вы уверены, что хотите отклонить этот проект?';
            } else if (action === 'delete') {
                confirmMessage = '⚠️ Вы уверены, что хотите БЕЗВОЗВРАТНО УДАЛИТЬ этот проект? Это действие нельзя отменить!';
            }

            if (!confirm(confirmMessage)) {
                return;
            }

            // Игнор кнопок
            const card = btn.closest('.application-card');
            if (card) {
                card.querySelectorAll('button').forEach(b => b.disabled = true);
            }
            
            const originalText = btn.textContent;
            btn.textContent = '⏳ Обработка...';

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
                        // минус карточка в DOM
                        if (card) {
                            card.style.transition = 'opacity 0.3s, transform 0.3s';
                            card.style.opacity = '0';
                            card.style.transform = 'translateX(-20px)';
                            setTimeout(() => {
                                card.remove();
                                // массив обновляется
                                allApplications = allApplications.filter(a => a._id !== productId);
                                updateStats();
                            }, 300);
                        }
                    } else {
                        // статус обновляется
                        const app = allApplications.find(a => a._id === productId);
                        if (app) {
                            app.status = data.newStatus;
                        }
                        // Перерендер
                        renderApplications();
                        updateStats();
                    }
                    
                    // уведомление
                    showNotification(data.message, 'success');
                } else {
                    throw new Error(data.error || 'Ошибка при модерации');
                }
            } catch (error) {
                console.error('Moderation error:', error);
                showNotification('Ошибка: ' + error.message, 'error');
                // снова кнопки найс
                if (card) {
                    card.querySelectorAll('button').forEach(b => b.disabled = false);
                }
                btn.textContent = originalText;
            }
        });
    }

    // обновление статистики
    function updateStats() {
        const pending = allApplications.filter(a => a.status === 'pending').length;
        const approved = allApplications.filter(a => a.status === 'approved').length;
        const rejected = allApplications.filter(a => a.status === 'rejected').length;
        
        const statPending = document.getElementById('stat-pending');
        const statApproved = document.getElementById('stat-approved');
        const statRejected = document.getElementById('stat-rejected');
        
        if (statPending) statPending.textContent = pending;
        if (statApproved) statApproved.textContent = approved;
        if (statRejected) statRejected.textContent = rejected;
    }

    // уведомления
    function showNotification(text, type) {
        // уведомление короткое
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 100000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;
        notification.textContent = text;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // обработчики фильтров
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
        // заказы загружаются
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

        // вешание обработчиков
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

    // обработчики фильтров непосредственно
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.filter;
            renderOrders();
        });
    });

    // загрузка заказов
    loadOrders();
    attachActionHandlers();
});