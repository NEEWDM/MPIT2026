/**
 * api/orders.js
 * API для управления заказами.
 * GET - получить заказы (по userId или все для админа)
 * POST - создать новый заказ
 * PUT - обновить статус заказа (для админа)
 */

const { MongoClient, ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ error: 'Database configuration error' });
    }

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const orders = database.collection('orders');
        const users = database.collection('users');

        // GET - получить заказы
        if (req.method === 'GET') {
            const filter = {};
            
            // Если передан userId - фильтруем по покупателю
            if (req.query.userId) {
                filter.buyerId = req.query.userId;
            }
            
            // Если передан status - фильтруем по статусу
            if (req.query.status) {
                filter.status = req.query.status;
            }
            
            // Если isAdmin=true и нет userId - показываем все заказы
            if (req.query.isAdmin === 'true' && !req.query.userId) {
                // Показываем все заказы
            }

            const ordersList = await orders.find(filter)
                .sort({ createdAt: -1 })
                .toArray();
            
            return res.status(200).json(ordersList);
        }

        // POST - создать новый заказ
        if (req.method === 'POST') {
            const { productId, contact, quantity, comment, buyerId, buyerName } = req.body;

            if (!productId || !contact || !quantity || !buyerId) {
                return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
            }

            const newOrder = {
                productId,
                buyerId,
                buyerName: buyerName || '',
                contact: contact.trim(),
                quantity: parseInt(quantity),
                comment: (comment || '').trim(),
                status: 'pending', // pending / approved / rejected
                createdAt: new Date()
            };

            const result = await orders.insertOne(newOrder);
            
            return res.status(201).json({
                success: true,
                orderId: result.insertedId,
                order: newOrder
            });
        }

        // PUT - обновить статус заказа (для админа)
        if (req.method === 'PUT') {
            const { orderId, action, adminId } = req.body;

            if (!orderId || !action || !adminId) {
                return res.status(400).json({ error: 'Не все параметры переданы' });
            }

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({ error: 'Неверное действие' });
            }

            // Проверяем, что пользователь — администратор
            const admin = await users.findOne({ _id: new ObjectId(adminId) });
            
            if (!admin || !admin.isAdmin) {
                return res.status(403).json({ error: 'Доступ запрещён' });
            }

            const newStatus = action === 'approve' ? 'approved' : 'rejected';

            const result = await orders.updateOne(
                { _id: new ObjectId(orderId) },
                { $set: { status: newStatus, processedAt: new Date() } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'Заказ не найден' });
            }

            return res.status(200).json({
                success: true,
                orderId,
                newStatus,
                message: action === 'approve' ? 'Заказ принят' : 'Заказ отклонён'
            });
        }

    } catch (error) {
        console.error('Orders API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (clientConn) await clientConn.close();
    }
}