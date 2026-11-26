/**
 * api/upload.js
 * Vercel Serverless Function для сохранения проекта в MongoDB.
 * Принимает данные проекта и сохраняет их в коллекцию 'products'.
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

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const products = database.collection('products');

        const {
            title,
            description,
            category,
            price,
            school,
            tags,
            image,
            userId,
            authorName,
            authorEmail
        } = req.body;

        // Валидация обязательных полей
        if (!title || !category || !price || !school || !image || !userId) {
            return res.status(400).json({ 
                error: 'Заполнены не все обязательные поля' 
            });
        }

        // Создаём документ проекта
        // Структура оптимизирована для будущей фильтрации в каталоге
        const newProduct = {
            title: title.trim(),
            description: (description || '').trim(),
            category: category,
            price: Number(price),
            school: school.trim(),
            tags: Array.isArray(tags) ? tags : [],
            image: image,
            userId: userId,
            authorName: authorName || '',
            authorEmail: authorEmail || '',
            status: 'pending', // pending / approved / rejected
            createdAt: new Date(),
            views: 0,
            sales: 0
        };

        const result = await products.insertOne(newProduct);

        return res.status(201).json({
            success: true,
            productId: result.insertedId.toString(),
            product: newProduct
        });

    } catch (error) {
        console.error('Upload API Error:', error);
        return res.status(500).json({ 
            error: error.message 
        });
    } finally {
        if (clientConn) {
            await clientConn.close();
        }
    }
}