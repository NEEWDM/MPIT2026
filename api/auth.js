// Vercel Serverless Function для авторизации
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await client.connect();
            const database = client.db('tuscul');
            const users = database.collection('users');

            if (req.body.action === 'register') {
                // Регистрация
                const { name, school, email, password, skills } = req.body;
                
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
                
                res.status(201).json({
                    user: {
                        id: result.insertedId,
                        name,
                        school,
                        email,
                        skills
                    }
                });
            } else if (req.body.action === 'login') {
                // Вход
                const { email, password } = req.body;
                const user = await users.findOne({ email });

                if (!user) {
                    return res.status(401).json({ error: 'Пользователь не найден' });
                }

                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Неверный пароль' });
                }

                res.status(200).json({
                    user: {
                        id: user._id,
                        name: user.name,
                        school: user.school,
                        email: user.email,
                        skills: user.skills
                    }
                });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        } finally {
            await client.close();
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}