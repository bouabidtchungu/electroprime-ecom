import { createServer } from 'http';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/electroprime';

// --- Seeding Logic (moved up for reference) ---
const seedData = async () => {
    try {
        console.log('📦 Checking for data migration...');
        const productCount = await Product.countDocuments();
        if (productCount === 0 && fs.existsSync(PRODUCTS_FILE)) {
            const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
            await Product.insertMany(data);
            console.log('✅ Seeded products');
        }

        if (await Home.countDocuments() === 0 && fs.existsSync(HOME_FILE)) {
            const data = JSON.parse(fs.readFileSync(HOME_FILE, 'utf8'));
            await Home.create(data);
            console.log('✅ Seeded home');
        }

        if (await About.countDocuments() === 0 && fs.existsSync(ABOUT_FILE)) {
            const data = JSON.parse(fs.readFileSync(ABOUT_FILE, 'utf8'));
            await About.create(data);
            console.log('✅ Seeded about');
        }

        if (await Footer.countDocuments() === 0 && fs.existsSync(FOOTER_FILE)) {
            const data = JSON.parse(fs.readFileSync(FOOTER_FILE, 'utf8'));
            await Footer.create(data);
            console.log('✅ Seeded footer');
        }

        if (await Global.countDocuments() === 0 && fs.existsSync(GLOBAL_FILE)) {
            const data = JSON.parse(fs.readFileSync(GLOBAL_FILE, 'utf8'));
            await Global.create(data);
            console.log('✅ Seeded global');
        }
    } catch (e) {
        console.error('❌ Seeding error:', e);
    }
};

// --- MongoDB Connection (Non-blocking) ---
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
}).then(() => {
    console.log('✅ Connected to MongoDB');
    seedData();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in degraded mode (DB disconnected)');
});

// Set port for development or production environment
const PORT = process.env.PORT || 3001;
const app = express();
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(cors());
app.use(bodyParser.json());

// --- Admin Security Configuration ---
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').toString();

const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }
};

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// --- File Upload Setup (Multer) ---
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        const uploadPath = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// --- Mongoose Models ---
const ProductSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    price: Number,
    image: String
});
const Product = mongoose.model('Product', ProductSchema);

const HomeSchema = new mongoose.Schema({
    title: String,
    subtitle: String,
    description: String,
    cta: String
}, { strict: false });
const Home = mongoose.model('Home', HomeSchema);

const AboutSchema = new mongoose.Schema({
    hero: Object,
    values: Array,
    stats: Array
}, { strict: false });
const About = mongoose.model('About', AboutSchema);

const FooterSchema = new mongoose.Schema({
    brandName: String,
    description: String,
    contact: Object,
    copyright: String
}, { strict: false });
const Footer = mongoose.model('Footer', FooterSchema);

const GlobalSchema = new mongoose.Schema({
    logoText: String,
    logoImage: String,
    logoAlignment: String,
    showLogoImage: Boolean
}, { strict: false });
const Global = mongoose.model('Global', GlobalSchema);

// --- Data Store Paths ---
const DATA_DIR = path.join(process.cwd(), 'server');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ABOUT_FILE = path.join(DATA_DIR, 'about.json');
const HOME_FILE = path.join(DATA_DIR, 'home.json');
const FOOTER_FILE = path.join(DATA_DIR, 'footer.json');
const GLOBAL_FILE = path.join(DATA_DIR, 'global.json');

// --- API Endpoints ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        env: process.env.NODE_ENV,
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        mongoUriPreview: MONGODB_URI.split('@')[1] ? '***@' + MONGODB_URI.split('@')[1] : 'Localhost/Other'
    });
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Add a product (with image)
app.post('/api/products', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const imageUrl = (req as any).file ? `/uploads/${(req as any).file.filename}` : req.body.imageUrl || '';

        const newProduct = new Product({
            id: Date.now().toString(),
            title,
            description,
            price: parseFloat(price),
            image: imageUrl
        });

        await newProduct.save();
        res.json(newProduct);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save product' });
    }
});

// Update a product
app.put('/api/products/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price } = req.body;
        const updateData: any = {
            title: title || undefined,
            description: description || undefined,
            price: price ? parseFloat(price) : undefined
        };

        if ((req as any).file) {
            updateData.image = `/uploads/${(req as any).file.filename}`;
        }

        const updatedProduct = await Product.findOneAndUpdate({ id }, { $set: updateData }, { new: true });
        if (!updatedProduct) return res.status(404).json({ error: 'Product not found' });
        res.json(updatedProduct);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete a product
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findOneAndDelete({ id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- Content APIs ---

app.get('/api/about', async (req, res) => {
    try {
        const content = await About.findOne();
        res.json(content);
    } catch (e) {
        res.status(500).json({ error: 'Content not found' });
    }
});

app.post('/api/about', authMiddleware, async (req, res) => {
    try {
        const newContent = req.body;
        await About.findOneAndUpdate({}, newContent, { upsert: true });
        res.json(newContent);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save content' });
    }
});

app.get('/api/home', async (req, res) => {
    try {
        const content = await Home.findOne();
        res.json(content);
    } catch (e) {
        res.status(500).json({ error: 'Content not found' });
    }
});

app.post('/api/home', authMiddleware, async (req, res) => {
    try {
        const newContent = req.body;
        await Home.findOneAndUpdate({}, newContent, { upsert: true });
        res.json(newContent);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save content' });
    }
});

app.get('/api/footer', async (req, res) => {
    try {
        const content = await Footer.findOne();
        res.json(content);
    } catch (e) {
        res.status(500).json({ error: 'Content not found' });
    }
});

app.post('/api/footer', authMiddleware, async (req, res) => {
    try {
        const newContent = req.body;
        await Footer.findOneAndUpdate({}, newContent, { upsert: true });
        res.json(newContent);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save content' });
    }
});

app.get('/api/global', async (req, res) => {
    try {
        const settings = await Global.findOne();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Content not found' });
    }
});

app.post('/api/global', authMiddleware, upload.single('logoImage'), async (req: any, res: any) => {
    try {
        const currentSettings = await Global.findOne() || {};
        const { logoText, logoAlignment, showLogoImage } = req.body;

        const newSettings: any = {
            logoText: logoText || (currentSettings as any).logoText,
            logoAlignment: logoAlignment || (currentSettings as any).logoAlignment,
            showLogoImage: showLogoImage === 'true' || showLogoImage === true,
        };

        if (req.file) {
            newSettings.logoImage = `/uploads/${req.file.filename}`;
        }

        const updated = await Global.findOneAndUpdate({}, newSettings, { upsert: true, new: true });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

const server = createServer(app);
const indexPath = path.join(process.cwd(), 'build', 'index.html');

if (isDevelopment) {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const config = require('../webpack.config.js');
    const compiler = webpack(config);

    app.use(webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath,
        writeToDisk: true,
    }));
    app.use(webpackHotMiddleware(compiler));
} else {
    app.use(express.static(path.resolve(__dirname, '..', 'build')));
}

app.get('*', (req, res) => {
    if (isDevelopment || path.extname(req.path).length === 0) {
        res.sendFile(indexPath);
    }
});

export default app;

if (isDevelopment || process.env.VITE_DEV === 'true') {
    server.listen(PORT, () => {
        console.log(`\n✅ Server is running in ${process.env.NODE_ENV} mode.`);
        console.log(`🌐 Application available at http://localhost:${PORT}\n`);
    });
}