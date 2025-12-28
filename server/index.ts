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
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').toString();

// --- Serverless Database Connection Helper ---
let isConnected = false;
const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) return;
    if (!MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI missing. JSON-Only mode active.');
        return;
    }
    try {
        console.log('🔗 Connecting to MongoDB...');
        const db = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = !!db.connections[0].readyState;
        console.log('✅ MongoDB Connected.');
    } catch (err: any) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
};

// --- Cloudinary ---
const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Auth Middleware ---
const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_PASSWORD) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

// --- Storage ---
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
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return null;
};

const getFallbackData = (filename: string, defaults: any) => {
    const filePath = getSafeJsonPath(filename);
    if (!filePath) return defaults;
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch (e) { return defaults; }
};

// --- API Endpoints ---
app.get('/api/health', async (req, res) => {
    await connectDB();
    res.json({
        status: 'UP',
        dbConnected: mongoose.connection.readyState === 1,
        cloudinaryConfigured: cloudinaryConfigured,
        checks: {
            MONGODB_URI: !!MONGODB_URI,
            CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        },
        time: new Date().toISOString()
    });
});

app.get('/api/products', async (req, res) => {
    await connectDB();
    const fallback = () => getFallbackData('products.json', []);
    try {
        const items = await Product.find().lean();
        res.json(items.length > 0 ? items : fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/about', async (req, res) => {
    await connectDB();
    const fallback = () => getFallbackData('about.json', { hero: {}, values: [], stats: [] });
    try {
        const data = await About.findOne().lean();
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/home', async (req, res) => {
    await connectDB();
    const fallback = () => getFallbackData('home.json', { title: '', subtitle: '', description: '', cta: '' });
    try {
        const data = await Home.findOne().lean();
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/footer', async (req, res) => {
    await connectDB();
    const fallback = () => getFallbackData('footer.json', { brandName: '', contact: {}, copyright: '' });
    try {
        const data = await Footer.findOne().lean();
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

app.get('/api/global', async (req, res) => {
    await connectDB();
    const fallback = () => getFallbackData('global.json', { logoText: 'ElectroPrime', logoAlignment: 'left' });
    try {
        const data = await Global.findOne().lean();
        res.json(data || fallback());
    } catch (e) { res.json(fallback()); }
});

// --- Mutations ---
app.post('/api/products', authMiddleware, upload.single('image'), async (req, res) => {
    await connectDB();
    try {
        const { title, description, price } = req.body;
        const imageUrl = (req as any).file ? (req as any).file.path : req.body.imageUrl || '';
        const newItem = new Product({ id: Date.now().toString(), title, description, price: parseFloat(price), image: imageUrl });
        await newItem.save();
        res.json(newItem);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', authMiddleware, upload.single('image'), async (req, res) => {
    await connectDB();
    try {
        const { id } = req.params;
        const { title, description, price } = req.body;
        const updateData: any = { title, description, price: price ? parseFloat(price) : undefined };
        if ((req as any).file) updateData.image = (req as any).file.path;
        const updated = await Product.findOneAndUpdate({ id }, { $set: updateData }, { new: true });
        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/about', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const result = await About.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/home', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const result = await Home.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/footer', authMiddleware, async (req, res) => {
    await connectDB();
    try {
        const result = await Footer.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/global', authMiddleware, upload.single('logoImage'), async (req: any, res: any) => {
    await connectDB();
    try {
        const { logoText, logoAlignment, showLogoImage } = req.body;
        const newSettings: any = { logoText, logoAlignment, showLogoImage: showLogoImage === 'true' || showLogoImage === true };
        if (req.file) newSettings.logoImage = req.file.path;
        const updated = await Global.findOneAndUpdate({}, newSettings, { upsert: true, new: true });
        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
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
    createServer(app).listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
}