/**
 * api/moderate.js
 * API для модерации проектов администратором.
 * Действия: approve, reject, delete
 */

const { MongoClient, ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Проверяем переменную окружения
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI не установлен');
        return res.status(500).json({ error: 'Database configuration error' });
    }

    const { productId, action, adminId } = req.body;

    // Валидация входных данных
    if (!productId || !action || !adminId) {
        return res.status(400).json({ 
            error: 'Не все параметры переданы',
            received: { productId, action, adminId }
        });
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
        return res.status(400).json({ error: 'Неверное действие' });
    }

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const users = database.collection('users');
        const products = database.collection('products');

        // Проверяем, что пользователь — администратор
        let admin;
        try {
            admin = await users.findOne({ _id: new ObjectId(adminId) });
        } catch (idError) {
            console.error('Ошибка преобразования adminId:', idError);
            return res.status(400).json({ error: 'Неверный формат adminId' });
        }
        
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещён. Вы не администратор.' });
        }

        // Проверяем существование проекта
        let product;
        try {
            product = await products.findOne({ _id: new ObjectId(productId) });
        } catch (idError) {
            console.error('Ошибка преобразования productId:', idError);
            return res.status(400).json({ error: 'Неверный формат productId' });
        }
        
        if (!product) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        // Обработка удаления
        if (action === 'delete') {
            const result = await products.deleteOne({ _id: new ObjectId(productId) });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Проект не найден для удаления' });
            }

            return res.status(200).json({
                success: true,
                message: 'Проект успешно удалён'
            });
        }

        // Обработка approve/reject
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        const result = await products.updateOne(
            { _id: new ObjectId(productId) },
            { 
                $set: { 
                    status: newStatus, 
                    moderatedAt: new Date(), 
                    moderatedBy: adminId 
                } 
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: 'Не удалось обновить статус проекта' });
        }

        return res.status(200).json({
            success: true,
            productId,
            newStatus,
            message: action === 'approve' 
                ? 'Проект одобрен и опубликован' 
                : 'Проект отклонён'
        });

    } catch (error) {
        console.error('Moderate API Error:', error);
        return res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (clientConn) {
            await clientConn.close();
        }
    }
}