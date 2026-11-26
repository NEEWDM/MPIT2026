/**
 * api/update-contacts.js
 * Vercel Serverless Function для обновления контактов пользователя.
 * Принимает userId и новые контакты, обновляет запись в MongoDB.
 */

const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ error: 'Database configuration error' });
    }

    const { userId, contacts } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId не указан' });
    }

    if (!contacts || typeof contacts !== 'object') {
        return res.status(400).json({ error: 'Контакты не переданы' });
    }

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const users = database.collection('users');

        // Проверяем существование пользователя
        const user = await users.findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Обновляем только поле contacts
        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { contacts: contacts } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: 'Не удалось обновить контакты' });
        }

        return res.status(200).json({
            success: true,
            message: 'Контакты обновлены',
            contacts: contacts
        });

    } catch (error) {
        console.error('Update contacts error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (clientConn) {
            await clientConn.close();
        }
    }
}