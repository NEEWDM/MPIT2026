const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async function handler(req, res) {
    try {
        await client.connect();
        const database = client.db('tuscul');
        const products = database.collection('products');

        if (req.method === 'GET') {
            const allProducts = await products.find({}).toArray();
            return res.status(200).json(allProducts);
        } else if (req.method === 'POST') {
            const product = {
                ...req.body,
                createdAt: new Date()
            };
            const result = await products.insertOne(product);
            return res.status(201).json({ id: result.insertedId, ...product });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}