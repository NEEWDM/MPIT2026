/**
 * upload.js
 * Логика страницы загрузки проекта.
 * Проверяет авторизацию, загружает фото в Cloudinary,
 * сохраняет данные проекта в MongoDB через API.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const authRequiredSection = document.getElementById('auth-required');
    const uploadSection = document.getElementById('upload-section');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('product-image');
    const uploadArea = document.getElementById('file-upload-area');
    const imagePreview = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadProgress = document.getElementById('upload-progress');
    const submitBtn = document.getElementById('submit-btn');
    const formMessage = document.getElementById('form-message');

    // Проверяем авторизацию
    const currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    if (!currentUser) {
        // Пользователь не авторизован — показываем сообщение
        authRequiredSection.classList.remove('hidden');
        uploadSection.classList.add('hidden');
    } else {
        // Пользователь авторизован — показываем форму
        authRequiredSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        
        // Автозаполняем школу из профиля
        if (currentUser.school) {
            document.getElementById('product-school').value = currentUser.school;
        }
    }

    // --- ЗАГРУЗКА ФОТО ---
    
    // Клик по области — открывает выбор файла
    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Выбор файла через диалог
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    let uploadedImageUrl = null; // URL загруженного фото в Cloudinary

    function handleFile(file) {
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            showMessage('Можно загружать только изображения', 'error');
            return;
        }

        // Проверка размера (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Файл слишком большой (макс. 5MB)', 'error');
            return;
        }

        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        // Загружаем в Cloudinary
        uploadToCloudinary(file);
    }

    async function uploadToCloudinary(file) {
        uploadProgress.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            // Получаем upload preset из переменных окружения Vercel
            // Для unsigned upload preset нужно настроить в Cloudinary Dashboard
            const uploadPreset = 'tuscul_uploads'; // Создай в Cloudinary
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'tuscul_products');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'tuscul'}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.secure_url) {
                uploadedImageUrl = data.secure_url;
                showMessage('Фото загружено ✓', 'success');
            } else {
                throw new Error('Не удалось загрузить фото');
            }
        } catch (error) {
            console.error('Cloudinary error:', error);
            showMessage('Ошибка загрузки фото. Попробуйте ещё раз.', 'error');
            uploadedImageUrl = null;
        } finally {
            uploadProgress.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    // --- ОТПРАВКА ФОРМЫ ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showMessage('Необходимо войти в систему', 'error');
            return;
        }

        if (!uploadedImageUrl) {
            showMessage('Сначала загрузите фотографию проекта', 'error');
            return;
        }

        // Собираем данные формы
        const productData = {
            title: document.getElementById('product-title').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            category: document.getElementById('product-category').value,
            price: parseInt(document.getElementById('product-price').value),
            school: document.getElementById('product-school').value.trim(),
            tags: document.getElementById('product-tags').value
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0),
            image: uploadedImageUrl,
            // Привязка к пользователю (для будущей фильтрации)
            userId: currentUser.id,
            authorName: currentUser.name,
            authorEmail: currentUser.email,
            createdAt: new Date().toISOString()
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Публикация...';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('🎉 Проект успешно опубликован!', 'success');
                uploadForm.reset();
                imagePreview.classList.add('hidden');
                uploadPlaceholder.classList.remove('hidden');
                uploadedImageUrl = null;
                
                // Возвращаем школу из профиля
                if (currentUser.school) {
                    document.getElementById('product-school').value = currentUser.school;
                }

                // Через 2 секунды редирект в профиль
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 2000);
            } else {
                throw new Error(result.error || 'Ошибка при сохранении');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showMessage('Ошибка: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Опубликовать проект';
        }
    });

    // Вспомогательная функция для сообщений
    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = 'form-message ' + type;
        formMessage.classList.remove('hidden');
        
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 4000);
    }
});