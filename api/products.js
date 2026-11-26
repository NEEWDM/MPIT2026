// Vercel Serverless Function для товаров
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    try {
        await client.connect();
        const database = client.db('tuscul');
        const products = database.collection('products');

        if (req.method === 'GET') {
            // Получить все товары
            const allProducts = await products.find({}).toArray();
            res.status(200).json(allProducts);
        } else if (req.method === 'POST') {
            // Добавить товар (требует авторизации)
            const product = {
                ...req.body,
                createdAt: new Date()
            };
            const result = await products.insertOne(product);
            res.status(201).json({ id: result.insertedId, ...product });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}