/**
 * api/products/[id].js
 * API для удаления проекта администратором.
 */

const { MongoClient, ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ error: 'Database configuration error' });
    }

    const { id } = req.query;
    const { adminId } = req.body;

    if (!id || !adminId) {
        return res.status(400).json({ error: 'Не все параметры переданы' });
    }

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const users = database.collection('users');
        const products = database.collection('products');

        // Проверяем админа
        const admin = await users.findOne({ _id: new ObjectId(adminId) });
        
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещён' });
        }

        // Удаляем проект
        const result = await products.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        return res.status(200).json({ success: true, message: 'Проект удалён' });

    } catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (clientConn) await clientConn.close();
    }
}