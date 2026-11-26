const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Проверка переменной окружения
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI не установлен!');
        return res.status(500).json({ error: 'Database configuration error' });
    }

    let client;
    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        
        const database = client.db('tuscul');
        const users = database.collection('users');

        const { action, name, school, email, password, skills } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action не указан' });
        }

        if (action === 'register') {
            if (!name || !school || !email || !password || !skills) {
                return res.status(400).json({ error: 'Заполните все поля' });
            }

            const existingUser = await users.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь уже существует' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = {
                name,
                school,
                email,
                password: hashedPassword,
                skills,
                contacts: req.body.contacts || {},
                createdAt: new Date()
            };

            const result = await users.insertOne(newUser);
            
            return res.status(201).json({
                user: {
                    id: result.insertedId.toString(),
                    name,
                    school,
                    email,
                    skills
                }
            });
        } else if (action === 'login') {
            if (!email || !password) {
                return res.status(400).json({ error: 'Укажите email и пароль' });
            }

            const user = await users.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: 'Пользователь не найден' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Неверный пароль' });
            }

            return res.status(200).json({
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    school: user.school,
                    email: user.email,
                    skills: user.skills
                }
            });
        } else {
            return res.status(400).json({ error: 'Неизвестное действие' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
}