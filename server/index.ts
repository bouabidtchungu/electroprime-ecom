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
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

// --- Cloudinary Configuration ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set port
const PORT = process.env.PORT || 3001;
const app = express();
const isDevelopment = process.env.NODE_ENV === 'development';

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

// --- Paths ---
const DATA_DIR = path.join(process.cwd(), 'server');
const getJsonData = (file: string) => {
    const filePath = path.join(DATA_DIR, file);
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
};

// --- API Endpoints with JSON Fallback ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

app.get('/api/products', async (req, res) => {
    try {
        let products = await Product.find();
        if (products.length === 0) products = getJsonData('products.json') || [];
        res.json(products);
    } catch (e) { res.json(getJsonData('products.json') || []); }
});

app.get('/api/about', async (req, res) => {
    try {
        let content = await About.findOne();
        if (!content) content = getJsonData('about.json');
        res.json(content);
    } catch (e) { res.json(getJsonData('about.json')); }
});

app.get('/api/home', async (req, res) => {
    try {
        let content = await Home.findOne();
        if (!content) content = getJsonData('home.json');
        res.json(content);
    } catch (e) { res.json(getJsonData('home.json')); }
});

app.get('/api/footer', async (req, res) => {
    try {
        let content = await Footer.findOne();
        if (!content) content = getJsonData('footer.json');
        res.json(content);
    } catch (e) { res.json(getJsonData('footer.json')); }
});

app.get('/api/global', async (req, res) => {
    try {
        let settings = await Global.findOne();
        if (!settings) settings = getJsonData('global.json');
        res.json(settings);
    } catch (e) { res.json(getJsonData('global.json')); }
});

// --- POST/PUT/DELETE remain Mongoose-only for persistence ---

app.post('/api/products', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const imageUrl = (req as any).file ? (req as any).file.path : req.body.imageUrl || '';
        const newProduct = new Product({ id: Date.now().toString(), title, description, price: parseFloat(price), image: imageUrl });
        await newProduct.save();
        res.json(newProduct);
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

// --- Server & Frontend Fallback ---
const server = createServer(app);
const indexPath = path.join(process.cwd(), 'build', 'index.html');

if (isDevelopment) {
    const webpack = require('webpack');
    const compiler = webpack(require('../webpack.config.js'));
    app.use(require('webpack-dev-middleware')(compiler, { publicPath: '/', writeToDisk: true }));
    app.use(require('webpack-hot-middleware')(compiler));
} else {
    app.use(express.static(path.resolve(__dirname, '..', 'build')));
}

app.get('*', (req, res) => {
    if (isDevelopment || path.extname(req.path).length === 0) res.sendFile(indexPath);
});

export default app;

if (isDevelopment || process.env.VITE_DEV === 'true') {
    server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}