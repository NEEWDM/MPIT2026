//модерация админом

const { MongoClient, ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ error: 'Database configuration error' });
    }

    const { productId, action, adminId } = req.body;

    if (!productId || !action || !adminId) {
        return res.status(400).json({ error: 'Не все параметры переданы' });
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
        return res.status(400).json({ error: 'Неверное действие' });
    }

    // удаление
    if (action === 'delete') {
        const result = await products.deleteOne({ _id: new ObjectId(productId) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        return res.status(200).json({
            success: true,
            message: 'Проект удалён'
        });
    }

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const users = database.collection('users');
        const products = database.collection('products');

        // проверка на админность
        const admin = await users.findOne({ _id: new ObjectId(adminId) });
        
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещён. Вы не администратор.' });
        }

        // поиск проекта
        const product = await products.findOne({ _id: new ObjectId(productId) });
        
        if (!product) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        // давание статуса
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        // обновление статуса
        const result = await products.updateOne(
            { _id: new ObjectId(productId) },
            { $set: { status: newStatus, moderatedAt: new Date(), moderatedBy: adminId } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: 'Не удалось обновить статус' });
        }

        // все вроде хорошо но нет

        return res.status(200).json({
            success: true,
            productId,
            newStatus,
            message: action === 'approve' ? 'Проект одобрен и опубликован' : 'Проект отклонён'
        });

    } catch (error) {
        console.error('Moderate API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (clientConn) await clientConn.close();
    }
}