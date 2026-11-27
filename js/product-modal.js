/**
 * product-modal.js
 * Логика модального окна с детальной информацией о проекте.
 * Открывается при клике на изображение проекта.
 */

// Глобальная функция для открытия модалки проекта
// isOwner — если true, скрывает кнопку "Купить" (для своего профиля)
window.openProductModal = function(product, isOwner = false) {
    // Сначала закрываем существующую модалку, если есть
    closeProductModal();

    // Форматируем дату
    const formattedDate = new Date(product.createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Названия категорий
    const categoryNames = {
        '3d_print': '3D Печать',
        'robotics': 'Робототехника',
        'woodwork': 'Дерево',
        'metalwork': 'Металл',
        'souvenirs': 'Сувениры',
        'digital': 'Цифровой проект',
        'crafts': 'Поделки'
    };

    const categoryName = categoryNames[product.category] || product.category;

    // Генерируем теги
    const tagsHTML = (product.tags && product.tags.length > 0) 
        ? product.tags.map(tag => `<span class="tag-item">#${tag}</span>`).join('')
        : '<span style="color:#999; font-style:italic;">Ключевые слова не указаны</span>';

    // Описание
    const descriptionHTML = product.description 
        ? `<p>${product.description}</p>`
        : '<p class="no-description">Описание не добавлено</p>';

    // Ссылка на автора
    const authorLink = product.userId ? `author.html?id=${product.userId}` : '#';

    // Кнопка "Купить" — показываем только если это НЕ профиль владельца
    const buyButtonHTML = isOwner 
        ? `<button class="btn btn-secondary" onclick="closeProductModal()">Закрыть</button>`
        : `
            <button class="btn btn-primary" onclick="closeProductModal(); openOrderModal('${product._id}', '${product.title.replace(/'/g, "\\'")}', ${product.price})">
                🛒 Купить
            </button>
            <button class="btn btn-secondary" onclick="closeProductModal()">
                Закрыть
            </button>
          `;

    const modalHTML = `
        <div class="product-modal">
            <div class="product-modal-content">
                <div class="product-modal-header">
                    <img src="${product.image}" alt="${product.title}" class="product-modal-image"
                         onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                    <button class="product-modal-close" onclick="closeProductModal()" aria-label="Закрыть">&times;</button>
                </div>
                <div class="product-modal-body">
                    <h2 class="product-modal-title">${product.title}</h2>
                    
                    <div class="product-modal-meta">
                        <div class="meta-item">
                            📂 <strong>Категория:</strong> ${categoryName}
                        </div>
                        <div class="meta-item">
                            👤 <strong>Автор:</strong> 
                            <a href="${authorLink}" style="color:var(--color-accent); text-decoration:none;">
                                ${product.authorName || 'Неизвестно'}
                            </a>
                        </div>
                        <div class="meta-item">
                            🏫 <strong>Школа:</strong> ${product.school || 'Не указана'}
                        </div>
                        <div class="meta-item">
                            📅 <strong>Добавлено:</strong> ${formattedDate}
                        </div>
                        <div class="meta-item price">
                            💰 ${product.price} ₽
                        </div>
                    </div>

                    <div class="product-modal-description">
                        <h4>📝 Описание</h4>
                        ${descriptionHTML}
                    </div>

                    <div class="product-modal-tags">
                        <h4>🏷️ Ключевые слова</h4>
                        <div class="tags-list">
                            ${tagsHTML}
                        </div>
                    </div>

                    <div class="product-modal-footer">
                        ${buyButtonHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Получаем ссылку на только что созданную модалку
    const modal = document.querySelector('.product-modal');

    // Закрытие по клику вне модалки
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProductModal();
        }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', handleEscape);
};

// Закрыть модалку
window.closeProductModal = function() {
    const modal = document.querySelector('.product-modal');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleEscape);
};

// Обработчик Escape
function handleEscape(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
}