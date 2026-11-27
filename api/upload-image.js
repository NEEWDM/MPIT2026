// кушаем файлы и в URL их на cloudify

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

    // снова секреты окружения
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'tuscul_uploads';

    if (!cloudName) {
        console.error('CLOUDINARY_CLOUD_NAME не установлен');
        return res.status(500).json({ error: 'Cloudinary не настроен' });
    }

    try {
        // принятие закидывания
        const { file, fileName } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'Файл не передан' });
        }

        // апишка для загрузки на облако
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const formData = new URLSearchParams();
        formData.append('file', file); // base64 data URL
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'tuscul_products');

        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();

        if (data.secure_url) {
            return res.status(200).json({
                success: true,
                url: data.secure_url,
                public_id: data.public_id
            });
        } else {
            console.error('Cloudinary error:', data);
            return res.status(500).json({ 
                error: 'Ошибка Cloudinary', 
                details: data.error?.message || data 
            });
        }
    } catch (error) {
        console.error('Upload image error:', error);
        return res.status(500).json({ error: error.message });
    }
}