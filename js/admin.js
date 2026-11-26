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
        ` : `
            <button class="btn-approve" disabled>Уже обработано</button>
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
        document.querySelectorAll('.btn-approve, .btn-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                const action = e.target.dataset.action;

                if (!confirm(`Вы уверены, что хотите ${action === 'approve' ? 'одобрить' : 'отклонить'} этот проект?`)) {
                    return;
                }

                e.target.disabled = true;
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
                        // Обновляем локально
                        const app = allApplications.find(a => a._id === productId);
                        if (app) {
                            app.status = data.newStatus;
                        }
                        
                        // Перезагружаем статистику и список
                        await loadApplications();
                        
                        alert(data.message);
                    } else {
                        throw new Error(data.error || 'Ошибка при модерации');
                    }
                } catch (error) {
                    console.error('Moderation error:', error);
                    alert('Ошибка: ' + error.message);
                    e.target.disabled = false;
                    e.target.textContent = action === 'approve' ? '✅ Одобрить' : '❌ Отклонить';
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
});