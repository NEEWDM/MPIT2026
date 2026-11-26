const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await client.connect();
        const database = client.db('tuscul');
        const users = database.collection('users');

        const { action, name, school, email, password, skills } = req.body;

        if (action === 'register') {
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
                createdAt: new Date()
            };

            const result = await users.insertOne(newUser);
            
            return res.status(201).json({
                user: {
                    id: result.insertedId,
                    name,
                    school,
                    email,
                    skills
                }
            });
        } else if (action === 'login') {
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
                    id: user._id,
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
        return res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}