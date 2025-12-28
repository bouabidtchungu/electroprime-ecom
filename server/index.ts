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

dotenv.config();

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI; // No default to localhost to avoid hangs
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').toString();

// --- MongoDB Connection (Fire and forget, non-blocking) ---
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 2000, // Faster failure for better responsiveness
        connectTimeoutMS: 5000,
        bufferCommands: false, // Don't queue queries if not connected
    }).catch(err => console.error('❌ DB Initial Connection Error:', err.message));
} else {
    console.warn('⚠️ MONGODB_URI not found. Running in JSON-only mode.');
}

// --- Cloudinary ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Auth Middleware ---
const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_PASSWORD) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

// --- Storage Configuration ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => ({
        folder: 'electroprime_uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'svg'],
        public_id: Date.now() + '-' + file.originalname.split('.')[0],
    }),
});
const upload = multer({ storage });

// --- Mongoose Models ---
const Product = mongoose.model('Product', new mongoose.Schema({ id: String, title: String, description: String, price: Number, image: String }));
const Home = mongoose.model('Home', new mongoose.Schema({ title: String, subtitle: String, description: String, cta: String }, { strict: false }));
const About = mongoose.model('About', new mongoose.Schema({ hero: Object, values: Array, stats: Array }, { strict: false }));
const Footer = mongoose.model('Footer', new mongoose.Schema({ brandName: String, contact: Object, copyright: String, description: String }, { strict: false }));
const Global = mongoose.model('Global', new mongoose.Schema({ logoText: String, logoAlignment: String, showLogoImage: Boolean, logoImage: String }, { strict: false }));

// --- Resilience Helpers ---
const getSafeJsonPath = (filename: string) => {
    const paths = [
        path.join(process.cwd(), 'server', filename),
        path.join(__dirname, '..', 'server', filename),
        path.join(__dirname, filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

const getFallbackData = (filename: string, defaults: any) => {
    const path = getSafeJsonPath(filename);
    if (!path) return defaults;
    try {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (e) { return defaults; }
};

// --- API Endpoints ---

app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        dbMode: MONGODB_URI ? 'Cloud' : 'JSON-Only',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        time: new Date().toISOString()
    });
});

app.get('/api/products', async (req, res) => {
    const fallback = () => getFallbackData('products.json', []);
    if (mongoose.connection.readyState !== 1) return res.json(fallback());
    try {
        const items = await Product.find().maxTimeMS(1500);
        res.json(items.length > 0 ? items : fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/about', async (req, res) => {
    const fallback = () => getFallbackData('about.json', { hero: { title: 'Our Story', subtitle: 'ElectroPrime', description: '' }, values: [], stats: [] });
    if (mongoose.connection.readyState !== 1) return res.json(fallback());
    try {
        const data = await About.findOne().maxTimeMS(1500);
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/home', async (req, res) => {
    const fallback = () => getFallbackData('home.json', { title: 'Welcome', subtitle: '', description: '', cta: 'Explore' });
    if (mongoose.connection.readyState !== 1) return res.json(fallback());
    try {
        const data = await Home.findOne().maxTimeMS(1500);
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/footer', async (req, res) => {
    const fallback = () => getFallbackData('footer.json', { brandName: 'ElectroPrime', contact: {}, copyright: '', description: '' });
    if (mongoose.connection.readyState !== 1) return res.json(fallback());
    try {
        const data = await Footer.findOne().maxTimeMS(1500);
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/global', async (req, res) => {
    const fallback = () => getFallbackData('global.json', { logoText: 'ElectroPrime', logoAlignment: 'left', showLogoImage: false });
    if (mongoose.connection.readyState !== 1) return res.json(fallback());
    try {
        const data = await Global.findOne().maxTimeMS(1500);
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

// --- Mutations (Only MongoDB) ---

app.post('/api/products', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const imageUrl = (req as any).file ? (req as any).file.path : req.body.imageUrl || '';
        const newItem = new Product({ id: Date.now().toString(), title, description, price: parseFloat(price), image: imageUrl });
        await newItem.save();
        res.json(newItem);
    } catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

app.put('/api/products/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price } = req.body;
        const updateData: any = { title, description, price: price ? parseFloat(price) : undefined };
        if ((req as any).file) updateData.image = (req as any).file.path;
        const updated = await Product.findOneAndUpdate({ id }, { $set: updateData }, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

app.post('/api/about', authMiddleware, async (req, res) => {
    try { await About.findOneAndUpdate({}, req.body, { upsert: true }); res.json(req.body); }
    catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

app.post('/api/home', authMiddleware, async (req, res) => {
    try { await Home.findOneAndUpdate({}, req.body, { upsert: true }); res.json(req.body); }
    catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

app.post('/api/footer', authMiddleware, async (req, res) => {
    try { await Footer.findOneAndUpdate({}, req.body, { upsert: true }); res.json(req.body); }
    catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

app.post('/api/global', authMiddleware, upload.single('logoImage'), async (req: any, res: any) => {
    try {
        const { logoText, logoAlignment, showLogoImage } = req.body;
        const newSettings: any = { logoText, logoAlignment, showLogoImage: showLogoImage === 'true' || showLogoImage === true };
        if (req.file) newSettings.logoImage = req.file.path;
        const updated = await Global.findOneAndUpdate({}, newSettings, { upsert: true, new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

// --- Serving ---
const indexPath = path.join(process.cwd(), 'build', 'index.html');
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
    const webpack = require('webpack');
    const compiler = webpack(require('../webpack.config.js'));
    app.use(require('webpack-dev-middleware')(compiler, { publicPath: '/', writeToDisk: true }));
    app.use(require('webpack-hot-middleware')(compiler));
} else {
    app.use(express.static(path.resolve(__dirname, '..', 'build')));
}

app.get('*', (req, res) => {
    if (isDev || path.extname(req.path).length === 0) res.sendFile(indexPath);
});

export default app;

if (isDev || process.env.VITE_DEV === 'true') {
    createServer(app).listen(PORT, () => console.log(`🚀 Dev server on port ${PORT}`));
}