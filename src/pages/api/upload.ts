import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

export const config = {
    api: {
        bodyParser: false,
    },
};

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'DELETE') {
        // Suppression d'un fichier uploadé (icône ingrédient ou image produit)
        try {
            const { url } = req.body;
            if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
                return res.status(400).json({ error: 'URL non valide.' });
            }
            const filePath = path.join(process.cwd(), 'public', url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'Erreur lors de la suppression.' });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const form = new IncomingForm({
        multiples: false,
        uploadDir: uploadsDir,
        keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de l\'upload.' });
        }
        const uploaded = files.file;
        const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
        if (!file) {
            return res.status(400).json({ error: 'Aucun fichier reçu.' });
        }

        const productId = fields.productId;
        if (!productId) {
            return res.status(400).json({ error: 'productId manquant.' });
        }
        const ext = path.extname(file.originalFilename || file.filepath);

        // Gestion upload ingrédient
        if (fields.ingredient && fields.ingredientIndex !== undefined) {
            const idx = fields.ingredientIndex;
            const newFileName = `ingredient_${productId}_${idx}${ext}`;
            const newFilePath = path.join(uploadsDir, newFileName);
            // Supprimer les anciennes icônes de cet ingrédient (autres extensions)
            const possibleExts = ['.png','.jpg','.jpeg','.webp','.gif'];
            for (const e of possibleExts) {
                const oldPath = path.join(uploadsDir, `ingredient_${productId}_${idx}${e}`);
                if (fs.existsSync(oldPath) && oldPath !== newFilePath) {
                    fs.unlinkSync(oldPath);
                }
            }
            if (file.filepath !== newFilePath) {
                fs.renameSync(file.filepath, newFilePath);
            }
            const fileUrl = `/uploads/${newFileName}`;
            return res.status(200).json({ url: fileUrl });
        }

        // Cas normal : image produit
        const newFileName = `product_${productId}${ext}`;
        const newFilePath = path.join(uploadsDir, newFileName);
        // Supprimer les anciennes images de ce produit (autres extensions)
        const possibleExts = ['.png','.jpg','.jpeg','.webp','.gif'];
        for (const e of possibleExts) {
            const oldPath = path.join(uploadsDir, `product_${productId}${e}`);
            if (fs.existsSync(oldPath) && oldPath !== newFilePath) {
                fs.unlinkSync(oldPath);
            }
        }
        // Renommer le fichier uploadé
        if (file.filepath !== newFilePath) {
            fs.renameSync(file.filepath, newFilePath);
        }
        // Retourner une URL utilisable côté client
        const fileUrl = `/uploads/${newFileName}`;
        return res.status(200).json({ url: fileUrl });
    });
}
