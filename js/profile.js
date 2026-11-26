/**
 * profile.js
 * Работа с MongoDB Atlas через Vercel API
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Переключение табов
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active-form'));
            btn.classList.add('active');
            const targetFormId = btn.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.getElementById(targetFormId).classList.add('active-form');
        });
    });

    // Проверка сессии при загрузке
    const currentUser = JSON.parse(localStorage.getItem('tuscul_user'));
    if (currentUser) {
        showDashboard(currentUser);
    }

    // РЕГИСТРАЦИЯ
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('reg-name').value,
                    school: document.getElementById('reg-school').value,
                    email: document.getElementById('reg-email').value,
                    password: document.getElementById('reg-pass').value,
                    skills: document.getElementById('reg-skills').value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('tuscul_user', JSON.stringify(data.user));
                showDashboard(data.user);
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            alert('Ошибка соединения: ' + error.message);
        }
    });

    // ВХОД
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: e.target.querySelector('input[type="text"]').value,
                    password: e.target.querySelector('input[type="password"]').value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('tuscul_user', JSON.stringify(data.user));
                showDashboard(data.user);
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            alert('Ошибка соединения: ' + error.message);
        }
    });

    // ВЫХОД
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('tuscul_user');
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    });

    function showDashboard(user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');

        document.getElementById('dash-name').textContent = user.name;
        document.getElementById('dash-school').textContent = `🏫 ${user.school}`;
        document.getElementById('dash-skills').innerHTML = `<span>${user.skills}</span>`;
    }
});