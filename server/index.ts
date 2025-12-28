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
            { value: '99%', label: 'Satisfaction' }
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
    if (!MONGODB_URI) return;
    try {
        const db = await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        isConnected = !!db.connections[0].readyState;
    } catch (err: any) { console.error('❌ DB Error:', err.message); }
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
    params: async (req: any, file: any) => ({
        folder: 'electroprime_uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'svg'],
        public_id: Date.now() + '-' + file.originalname.split('.')[0],
    }),
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Auth Middleware ---
const authMiddleware = (req: any, res: any, next: any) => {
    if (req.headers['x-admin-token'] === ADMIN_PASSWORD) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

// --- Models ---
const Product = mongoose.model('Product', new mongoose.Schema({ id: String, title: String, description: String, price: Number, image: String }));
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
    res.json({ status: 'UP', db: mongoose.connection.readyState === 1, cloud: cloudinaryConfigured });
});

app.get('/api/products', async (req, res) => {
    await connectDB();
    try {
        const items = await Product.find().lean();
        res.json(items.length > 0 ? items : getJsonData('products.json', []));
    } catch (e) { res.json(getJsonData('products.json', [])); }
});

app.get('/api/about', async (req, res) => {
    await connectDB();
    try {
        const data = await About.findOne().lean();
        res.json(data || getJsonData('about.json', DEFAULTS.about));
    } catch (e) { res.json(getJsonData('about.json', DEFAULTS.about)); }
});

app.get('/api/home', async (req, res) => {
    await connectDB();
    try {
        const data = await Home.findOne().lean();
        res.json(data || getJsonData('home.json', DEFAULTS.home));
    } catch (e) { res.json(getJsonData('home.json', DEFAULTS.home)); }
});

app.get('/api/footer', async (req, res) => {
    await connectDB();
    try {
        const data = await Footer.findOne().lean();
        res.json(data || getJsonData('footer.json', DEFAULTS.footer));
    } catch (e) { res.json(getJsonData('footer.json', DEFAULTS.footer)); }
});

app.get('/api/global', async (req, res) => {
    await connectDB();
    try {
        const data = await Global.findOne().lean();
        res.json(data || getJsonData('global.json', DEFAULTS.global));
    } catch (e) { res.json(getJsonData('global.json', DEFAULTS.global)); }
});

// --- Mutations ---
app.post('/api/products', authMiddleware, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: 'Upload failed: ' + err.message });
        next();
    });
}, async (req, res) => {
    await connectDB();
    try {
        const { title, description, price } = req.body;
        const imageUrl = (req as any).file ? (req as any).file.path : req.body.imageUrl || '';
        const newItem = new Product({ id: Date.now().toString(), title, description, price: parseFloat(price), image: imageUrl });
        await newItem.save();
        res.json(newItem);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', authMiddleware, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: 'Upload failed: ' + err.message });
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
        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/about', authMiddleware, async (req, res) => {
    await connectDB();
    try { res.json(await About.findOneAndUpdate({}, req.body, { upsert: true, new: true })); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/home', authMiddleware, async (req, res) => {
    await connectDB();
    try { res.json(await Home.findOneAndUpdate({}, req.body, { upsert: true, new: true })); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/footer', authMiddleware, async (req, res) => {
    await connectDB();
    try { res.json(await Footer.findOneAndUpdate({}, req.body, { upsert: true, new: true })); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
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
    createServer(app).listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}