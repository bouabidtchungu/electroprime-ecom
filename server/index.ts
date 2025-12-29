import { createServer } from 'http';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config({ path: path.join(process.cwd(), '.env') });
console.log('🌍 Environment variables loaded from:', path.join(process.cwd(), '.env'));

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').toString();

// --- Defaults for UI Stability ---
const DEFAULTS = {
    about: {
        hero: { title: 'Our Story', subtitle: 'ElectroPrime', description: 'Experience excellence in electronics.' },
        values: [
            { title: 'Innovation', description: 'Cutting edge tech for the modern home.' },
            { title: 'Quality', description: 'Curated selection of premium devices.' },
            { title: 'Service', description: 'Dedicated support for every customer.' }
        ],
        stats: [
            { value: '10k+', label: 'Products Sold' },
            { value: '99%', label: 'Satisfaction' },
            { value: '24/7', label: 'Support' },
            { value: '50+', label: 'Partners' }
        ]
    },
    home: { title: 'Welcome to ElectroPrime', subtitle: 'The Future of Tech', description: 'Your destination for premium electronics and professional gadgets.', cta: 'Shop Collection' },
    footer: { brandName: 'ElectroPrime', description: 'Elevating your digital life.', contact: { email: 'support@electroprime.com', phone: '+1 (800) 555-0123' }, copyright: '© 2024 ElectroPrime. All rights reserved.' },
    global: { logoText: 'ElectroPrime', logoAlignment: 'left', showLogoImage: false, logoImage: '' }
};

// --- Serverless Database Connection ---
let isConnected = false;
const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) return;
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing from environment variables!');
        return;
    }
    try {
        console.log('🔌 Attempting MongoDB connection...');
        const db = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 10000,
            bufferCommands: false // Disable buffering so it fails fast
        });
        isConnected = !!db.connections[0].readyState;
        console.log('✅ Connected to MongoDB');
    } catch (err: any) {
        const msg = err.message || 'Unknown error';
        console.error(`❌ MongoDB Connection Error: ${msg}`);
        if (msg.includes('Authentication failed')) {
            console.error('👉 CHECK: Are your MongoDB username/password correct in Vercel?');
        } else if (msg.includes('timed out')) {
            console.error('👉 CHECK: Is your MongoDB Atlas IP Access 0.0.0.0/0 allowed?');
        }
    }
};

// --- Cloudinary & Storage ---
const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'electroprime_uploads',
        format: 'jpg',
        public_id: (req: any, file: any) => `${Date.now()}-${file.originalname.split('.')[0].replace(/[^a-z0-9]/gi, '_')}`
    } as any
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit - Vercel is 4.5MB total
});

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5MB' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5MB' }));

// --- Auth Middleware ---
const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_PASSWORD.trim()) {
        next();
    } else {
        console.warn('❌ Unauthorized access attempt. Correct password starts with:', ADMIN_PASSWORD.substring(0, 2));
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- Models ---
const Product = mongoose.model('Product', new mongoose.Schema({ id: { type: String, required: true, index: true }, title: String, description: String, price: Number, image: String }));
const Home = mongoose.model('Home', new mongoose.Schema({}, { strict: false }));
const About = mongoose.model('About', new mongoose.Schema({}, { strict: false }));
const Footer = mongoose.model('Footer', new mongoose.Schema({}, { strict: false }));
const Global = mongoose.model('Global', new mongoose.Schema({}, { strict: false }));

// --- Helpers ---
const getSafeJsonPath = (filename: string) => {
    const paths = [path.join(process.cwd(), 'server', filename), path.join(__dirname, '..', 'server', filename), path.join(__dirname, filename)];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return null;
};
const getJsonData = (file: string, def: any) => {
    const p = getSafeJsonPath(file);
    if (!p) return def;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { return def; }
};

// --- API ---
app.get('/api/health', async (req, res) => {
    await connectDB();
    res.json({
        status: 'UP',
        db: mongoose.connection.readyState === 1,
        cloud: cloudinaryConfigured,
        diagnostics: {
            node_env: process.env.NODE_ENV,
            has_mongo: !!process.env.MONGODB_URI,
            has_cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
            has_api_key: !!process.env.CLOUDINARY_API_KEY,
            has_api_secret: !!process.env.CLOUDINARY_API_SECRET?.substring(0, 4) + '***'
        }
    });
});

app.get('/api/products', async (req, res) => {
    await connectDB();
    try {
        const items = await Product.find().maxTimeMS(2000).lean();
        res.json(items && items.length > 0 ? items : getJsonData('products.json', []));
    } catch (e) { res.json(getJsonData('products.json', [])); }
});

app.get('/api/about', async (req, res) => {
    await connectDB();
    try {
        const data = await About.findOne().maxTimeMS(2000).lean();
        res.json(data || getJsonData('about.json', DEFAULTS.about));
    } catch (e) { res.json(getJsonData('about.json', DEFAULTS.about)); }
});

app.get('/api/home', async (req, res) => {
    await connectDB();
    try {
        const data = await Home.findOne().maxTimeMS(2000).lean();
        res.json(data || getJsonData('home.json', DEFAULTS.home));
    } catch (e) { res.json(getJsonData('home.json', DEFAULTS.home)); }
});

app.get('/api/footer', async (req, res) => {
    await connectDB();
    try {
        const data = await Footer.findOne().maxTimeMS(2000).lean();
        res.json(data || getJsonData('footer.json', DEFAULTS.footer));
    } catch (e) { res.json(getJsonData('footer.json', DEFAULTS.footer)); }
});

app.get('/api/global', async (req, res) => {
    await connectDB();
    try {
        const data = await Global.findOne().maxTimeMS(2000).lean();
        res.json(data || getJsonData('global.json', DEFAULTS.global));
    } catch (e) { res.json(getJsonData('global.json', DEFAULTS.global)); }
});

// --- Mutations ---
app.post('/api/products', authMiddleware, (req: any, res: any, next: any) => {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
        console.log(`📡 Product Post Request Size: ${(parseInt(contentLength) / 1024).toFixed(2)} KB`);
        if (parseInt(contentLength) > 4.5 * 1024 * 1024) {
            console.error('⚠️ REQUEST TOO LARGE: Vercel limit is 4.5MB');
        }
    }
    upload.single('image')(req, res, (err: any) => {
        if (err) {
            console.error('❌ Multer Upload Error:', err);
            let message = 'Image upload failed';
            if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large. Vercel limits uploads to 4.5MB.';
            return res.status(400).json({ error: message + ': ' + (err.message || '') });
        }
        next();
    });
}, async (req: any, res: any) => {
    await connectDB();
    try {
        const { title, description, price } = req.body;
        if (!title || !price) {
            return res.status(400).json({ error: 'Title and Price are required.' });
        }
        const imageUrl = (req as any).file ? (req as any).file.path : req.body.imageUrl || '';
        const newItem = new Product({ id: String(Date.now()), title, description, price: parseFloat(price), image: imageUrl });
        await newItem.save();
        console.log('✅ Product created:', title);
        res.json(newItem);
    } catch (e: any) {
        console.error('❌ Product creation error:', e);
        res.status(500).json({ error: 'Database error: ' + e.message });
    }
});

app.put('/api/products/:id', authMiddleware, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('❌ Multer Update Error:', err);
            return res.status(400).json({ error: 'Upload failed: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    await connectDB();
    try {
        const { id } = req.params;
        const { title, description, price } = req.body;
        const updateData: any = { title, description, price: price ? parseFloat(price) : undefined };
        if ((req as any).file) updateData.image = (req as any).file.path;
        const updated = await Product.findOneAndUpdate({ id }, { $set: updateData }, { new: true });
        if (!updated) return res.status(404).json({ error: 'Product not found' });
        console.log('✅ Product updated:', title);
        res.json(updated);
    } catch (e: any) {
        console.error('❌ Product update error:', e);
        res.status(500).json({ error: 'Database update failed: ' + e.message });
    }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const { id } = req.params;
        // Try deleting as string and as number just in case
        const deleted = await Product.deleteOne({
            $or: [{ id: id }, { id: parseFloat(id) || id }]
        });
        console.log('🗑️ Product deleted attempt:', id, deleted.deletedCount);
        res.json({ success: true, deletedCount: deleted.deletedCount });
    } catch (e: any) {
        console.error('❌ Delete error:', e);
        res.status(500).json({ error: 'Delete failed: ' + e.message });
    }
});

app.post('/api/products-clear-all', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        await Product.deleteMany({});
        console.log('🧹 All products cleared from DB');
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Clear failed: ' + e.message });
    }
});

app.post('/api/about', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const updated = await About.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        console.log('✅ About updated');
        res.json(updated);
    }
    catch (e: any) {
        console.error('❌ About save error:', e);
        res.status(500).json({ error: 'Save failed: ' + e.message });
    }
});

app.post('/api/home', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const updated = await Home.findOneAndUpdate({}, req.body || {}, { upsert: true, new: true });
        console.log('✅ Home updated');
        res.json(updated);
    }
    catch (e: any) {
        console.error('❌ Home save error:', e);
        res.status(500).json({ error: 'Home save failed: ' + e.message });
    }
});

app.post('/api/footer', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const updated = await Footer.findOneAndUpdate({}, req.body || {}, { upsert: true, new: true });
        console.log('✅ Footer updated');
        res.json(updated);
    }
    catch (e: any) {
        console.error('❌ Footer save error:', e);
        res.status(500).json({ error: 'Footer save failed: ' + e.message });
    }
});

app.post('/api/global', authMiddleware, (req: any, res: any, next: any) => {
    upload.single('logoImage')(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: 'Logo upload failed: ' + err.message });
        next();
    });
}, async (req: any, res: any) => {
    await connectDB();
    try {
        const { logoText, logoAlignment, showLogoImage } = req.body;
        const updateData: any = {
            logoText: logoText || 'ElectroPrime',
            logoAlignment: logoAlignment || 'left',
            showLogoImage: showLogoImage === 'true' || showLogoImage === true
        };
        if (req.file) updateData.logoImage = req.file.path;

        const updated = await Global.findOneAndUpdate({}, { $set: updateData }, { upsert: true, new: true });
        console.log('✅ Global settings updated');
        res.json(updated);
    } catch (e: any) {
        console.error('❌ Global save error:', e);
        res.status(500).json({ error: 'Settings save failed: ' + e.message });
    }
});

// --- Serving ---
const indexPath = path.join(process.cwd(), 'build', 'index.html');
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    const compiler = require('webpack')(require('../webpack.config.js'));
    app.use(require('webpack-dev-middleware')(compiler, { publicPath: '/', writeToDisk: true }));
    app.use(require('webpack-hot-middleware')(compiler));
} else { app.use(express.static(path.resolve(__dirname, '..', 'build'))); }

app.get('*', (req, res) => {
    if (isDev || path.extname(req.path).length === 0) res.sendFile(indexPath);
});

export default app;

if (isDev || process.env.VITE_DEV === 'true') {
    (async () => {
        await connectDB();
        createServer(app).listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
    })();
}