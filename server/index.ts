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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/electroprime';

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
}).then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// --- Cloudinary Configuration ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Admin Security ---
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').toString();
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
const Home = mongoose.model('Home', new mongoose.Schema({}, { strict: false }));
const About = mongoose.model('About', new mongoose.Schema({}, { strict: false }));
const Footer = mongoose.model('Footer', new mongoose.Schema({}, { strict: false }));
const Global = mongoose.model('Global', new mongoose.Schema({}, { strict: false }));

// --- Flexible Pathing for Vercel ---
// We try process.cwd() first, then fallback to relative from __dirname
const getSafeJsonPath = (filename: string) => {
    const paths = [
        path.join(process.cwd(), 'server', filename),
        path.join(__dirname, filename),
        path.join(__dirname, '..', 'server', filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

const getJsonData = (file: string, defaultValue: any) => {
    const filePath = getSafeJsonPath(file);
    if (!filePath) return defaultValue;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { return defaultValue; }
};

// --- API Endpoints ---

app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        cwd: process.cwd(),
        dirname: __dirname,
        serverDirExists: fs.existsSync(path.join(process.cwd(), 'server'))
    });
});

app.get('/api/products', async (req, res) => {
    try {
        let items = await Product.find();
        if (items.length === 0) items = getJsonData('products.json', []);
        res.json(items);
    } catch (e) { res.json(getJsonData('products.json', [])); }
});

app.get('/api/about', async (req, res) => {
    try {
        let data = await About.findOne();
        if (!data) data = getJsonData('about.json', { hero: {}, values: [], stats: [] });
        res.json(data);
    } catch (e) { res.json(getJsonData('about.json', { hero: {}, values: [], stats: [] })); }
});

app.get('/api/home', async (req, res) => {
    try {
        let data = await Home.findOne();
        if (!data) data = getJsonData('home.json', { title: '', subtitle: '', description: '', cta: '' });
        res.json(data);
    } catch (e) { res.json(getJsonData('home.json', { title: '', subtitle: '', description: '', cta: '' })); }
});

app.get('/api/footer', async (req, res) => {
    try {
        let data = await Footer.findOne();
        if (!data) data = getJsonData('footer.json', { branding: '', contact: {}, copyright: '' });
        res.json(data);
    } catch (e) { res.json(getJsonData('footer.json', { branding: '', contact: {}, copyright: '' })); }
});

app.get('/api/global', async (req, res) => {
    try {
        let data = await Global.findOne();
        if (!data) data = getJsonData('global.json', { logoText: 'ElectroPrime', logoAlignment: 'left', showLogoImage: false });
        res.json(data);
    } catch (e) { res.json(getJsonData('global.json', { logoText: 'ElectroPrime', logoAlignment: 'left', showLogoImage: false })); }
});

// --- Write Operations ---

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

// --- Static & Frontend ---
const indexPath = path.join(process.cwd(), 'build', 'index.html');
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
    const compiler = require('webpack')(require('../webpack.config.js'));
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
    createServer(app).listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}