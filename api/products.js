const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const products = database.collection('products');

        if (req.method === 'GET') {
            const filter = {};
            
            // По умолчанию показываем только одобренные проекты
            // Если передан userId - показываем все проекты этого пользователя (для его профиля)
            // Если передан status - фильтруем по статусу (для админки)
            
            if (req.query.userId) {
                filter.userId = req.query.userId;
                // Если есть параметр allStatus=true - показываем все статусы
                if (req.query.allStatus !== 'true') {
                    filter.status = 'approved';
                }
            } else if (req.query.status) {
                // Фильтр по статусу (для админки)
                filter.status = req.query.status;
            } else {
                // Публичный каталог - только одобренные
                filter.status = 'approved';
            }
            
            if (req.query.category) filter.category = req.query.category;
            if (req.query.school) filter.school = { $regex: req.query.school, $options: 'i' };
            if (req.query.search) {
                filter.$or = [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } },
                    { tags: { $regex: req.query.search, $options: 'i' } }
                ];
            }

            const allProducts = await products.find(filter)
                .sort({ createdAt: -1 })
                .toArray();
            
            return res.status(200).json(allProducts);
            
        } else if (req.method === 'POST') {
            const product = {
                ...req.body,
                createdAt: new Date()
            };
            const result = await products.insertOne(product);
            return res.status(201).json({ id: result.insertedId, ...product });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (clientConn) await clientConn.close();
    }
}