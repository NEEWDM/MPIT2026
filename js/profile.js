/**
 * profile.js
 * Управляет логикой авторизации, регистрации и отображением личного кабинета.
 * Использует localStorage для имитации сохранения сессии.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // DOMа
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const logoutBtn = document.getElementById('logout-btn');

    // логика входа и регистрации
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // убираем активность
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active-form'));
            
            // а нажатому даем активность
            btn.classList.add('active');
            const targetFormId = btn.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.getElementById(targetFormId).classList.add('active-form');
        });
    });

    // типо база данных пользователей(нет)
    // если есть то профиль
    const currentUser = JSON.parse(localStorage.getItem('tuscul_user'));

    if (currentUser) {
        showDashboard(currentUser);
    }

    // если нету то вот такое
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // съесть данные
        const newUser = {
            id: Date.now(), // айди по дате, чтобы типо случайный
            name: document.getElementById('reg-name').value,
            school: document.getElementById('reg-school').value,
            email: document.getElementById('reg-email').value,
            skills: document.getElementById('reg-skills').options[document.getElementById('reg-skills').selectedIndex].text,
            products: [] // тут ничо нету
        };

        // сохранили в типо базу данных
        localStorage.setItem('tuscul_user', JSON.stringify(newUser));
        
        // и профиль
        showDashboard(newUser);
    });

    // вход
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // если есть в локалстораге то круто
        const savedUser = JSON.parse(localStorage.getItem('tuscul_user'));
        if (savedUser) {
            showDashboard(savedUser);
        } else {
            alert('Пользователь не найден. Пожалуйста, зарегистрируйтесь.');
        }
    });

    // выход из акка
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('tuscul_user');
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        // заново все почистить
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
    });

    // как отображать дэшборд
    function showDashboard(user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');

        // заполнить из данных
        document.getElementById('dash-name').textContent = user.name;
        document.getElementById('dash-school').textContent = `🏫 ${user.school}`;
        
        // рендер навыков
        const skillsContainer = document.getElementById('dash-skills');
        skillsContainer.innerHTML = `<span>${user.skills}</span>`;

        // рендер товаров(их нет(((( )
        renderMyProducts(user.products);
    }

    // функция рендера товаров
    function renderMyProducts(products) {
        const grid = document.getElementById('my-products-grid');
        grid.innerHTML = '';

        if (!products || products.length === 0) {
            grid.innerHTML = '<div class="empty-state">У вас пока нет загруженных работ. Начните продавать свои умения!</div>';
            return;
        }

        // отрисовка карточек как в  мейне, но тут крч да
        products.forEach(prod => {
            // тут ничего нет
        });
    }
});