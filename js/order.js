//логика модального окна закзазаызаваываывн

// глобальная функция чтобы открыть
window.openOrderModal = function(productId, productTitle, productPrice) {
    // авторизирован?
    const currentUser = JSON.parse(localStorage.getItem('tuscul_user'));
    
    if (!currentUser) {
        alert('Для покупки необходимо войти в аккаунт');
        window.location.href = 'profile.html';
        return;
    }

    // сделать окошко
    const modalHTML = `
        <div id="order-modal" class="order-modal">
            <div class="order-modal-content">
                <div class="order-modal-header">
                    <h3>Оформление заказа</h3>
                    <button class="order-close-btn" onclick="closeOrderModal()">&times;</button>
                </div>
                
                <div class="order-product-info">
                    <h4>${productTitle}</h4>
                    <p>Цена за единицу: <span class="price">${productPrice} ₽</span></p>
                </div>

                <form id="order-form" class="order-form">
                    <div class="form-group">
                        <label>Контакт для связи <span class="required">*</span></label>
                        <input type="text" id="order-contact" placeholder="Email, телефон или Telegram" required>
                        <span class="order-form-hint">Как с вами связаться?</span>
                    </div>

                    <div class="form-group">
                        <label>Количество <span class="required">*</span></label>
                        <input type="number" id="order-quantity" min="1" value="1" required>
                    </div>

                    <div class="form-group">
                        <label>Комментарий</label>
                        <textarea id="order-comment" placeholder="Дополнительная информация (необязательно)"></textarea>
                    </div>

                    <div class="order-total">
                        <span class="order-total-label">Итого:</span>
                        <span class="order-total-price" id="order-total-price">${productPrice} ₽</span>
                    </div>

                    <div class="order-actions">
                        <button type="submit" class="btn btn-primary">Приобрести</button>
                        <button type="button" class="btn btn-outline" onclick="closeOrderModal()">Отмена</button>
                    </div>

                    <div id="order-message" class="order-message hidden"></div>
                </form>
            </div>
        </div>
    `;

    // окошко в боди
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // обработчик изменения количества
    const quantityInput = document.getElementById('order-quantity');
    const totalPriceElement = document.getElementById('order-total-price');
    
    quantityInput.addEventListener('input', (e) => {
        const quantity = parseInt(e.target.value) || 1;
        const total = productPrice * quantity;
        totalPriceElement.textContent = `${total} ₽`;
    });

    // обработчик отправки
    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const contact = document.getElementById('order-contact').value.trim();
        const quantity = parseInt(document.getElementById('order-quantity').value);
        const comment = document.getElementById('order-comment').value.trim();

        if (!contact || !quantity) {
            showOrderMessage('Заполните все обязательные поля', 'error');
            return;
        }

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    contact,
                    quantity,
                    comment,
                    buyerId: currentUser.id,
                    buyerName: currentUser.name
                })
            });

            const data = await response.json();

            if (response.ok) {
                showOrderMessage('✓ Заказ оформлен! Ожидайте рассмотрения.', 'success');
                
                setTimeout(() => {
                    closeOrderModal();
                }, 2000);
            } else {
                throw new Error(data.error || 'Ошибка при оформлении заказа');
            }
        } catch (error) {
            console.error('Order error:', error);
            showOrderMessage('Ошибка: ' + error.message, 'error');
        }
    });
};

// закрывание
window.closeOrderModal = function() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.remove();
    }
};

// закрывание по клику вне окна
document.addEventListener('click', (e) => {
    const modal = document.getElementById('order-modal');
    if (modal && e.target === modal) {
        closeOrderModal();
    }
});

// показать сообщение
function showOrderMessage(text, type) {
    const messageEl = document.getElementById('order-message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = 'order-message ' + type;
        messageEl.classList.remove('hidden');
    }
}