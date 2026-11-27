//данные пользователя для его профиля(с чужих глаз)

const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ error: 'Database configuration error' });
    }

    const userId = req.query.id;

    if (!userId) {
        return res.status(400).json({ error: 'userId не указан' });
    }

    let clientConn;
    try {
        clientConn = new MongoClient(process.env.MONGODB_URI);
        await clientConn.connect();
        
        const database = clientConn.db('tuscul');
        const users = database.collection('users');

        // ищем кого брать
        const user = await users.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // публичные данные
        const publicUserData = {
            id: user._id.toString(),
            name: user.name,
            school: user.school,
            skills: user.skills,
            contacts: user.contacts || {},
            createdAt: user.createdAt
        };

        return res.status(200).json(publicUserData);

    } catch (error) {
        console.error('User API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (clientConn) {
            await clientConn.close();
        }
    }
}