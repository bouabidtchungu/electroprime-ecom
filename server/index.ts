import { createServer } from 'http';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

// Set port for development or production environment
const PORT = process.env.PORT || 3001;
const app = express();
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(cors());
app.use(bodyParser.json());

// --- Admin Security Configuration ---
// In a real production app, this should be in an environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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

// --- Data Store Paths (using process.cwd for Serverless compatibility) ---
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
        cwd: process.cwd()
    });
});

// Get all products
app.get('/api/products', (req, res) => {
    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        if (err) {
            // If file doesn't exist, return empty array
            if (err.code === 'ENOENT') return res.json([]);
            return res.status(500).json({ error: 'Failed to read products' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]);
        }
    });
});

// Add a product (with image)
app.post('/api/products', authMiddleware, upload.single('image'), (req, res) => {
    const { title, description, price } = req.body;
    // req.file contains the uploaded file info
    const imageUrl = (req as any).file ? `/uploads/${(req as any).file.filename}` : req.body.imageUrl || '';

    const newProduct = {
        id: Date.now().toString(),
        title,
        description,
        price: parseFloat(price),
        image: imageUrl
    };

    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        let products = [];
        if (!err && data) {
            try {
                products = JSON.parse(data);
            } catch (e) { }
        }
        products.push(newProduct);

        fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save product' });
            res.json(newProduct);
        });
    });
});

// Update a product
app.put('/api/products/:id', authMiddleware, upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { title, description, price } = req.body;

    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read products' });

        let products = [];
        try {
            products = JSON.parse(data);
        } catch (e) { }

        const productIndex = products.findIndex((p: any) => p.id === id);
        if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });

        // Update fields
        const updatedProduct = {
            ...products[productIndex],
            title: title || products[productIndex].title,
            description: description || products[productIndex].description,
            price: price ? parseFloat(price) : products[productIndex].price,
            // If new image uploaded, use it. Otherwise keep old one.
            image: (req as any).file ? `/uploads/${(req as any).file.filename}` : products[productIndex].image
        };

        products[productIndex] = updatedProduct;

        fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update product' });
            res.json(updatedProduct);
        });
    });
});

// Delete a product
app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read products' });
        let products = [];
        try {
            products = JSON.parse(data);
        } catch (e) { }

        const filteredProducts = products.filter((p: any) => p.id !== id);
        fs.writeFile(PRODUCTS_FILE, JSON.stringify(filteredProducts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to delete product' });
            res.json({ success: true });
        });
    });
});


// Create and start the HTTP server
const server = createServer(app);

// --- Development Setup ---
if (isDevelopment) {
    // Note: We use require here because these modules are only needed in development and shouldn't be bundled in production.
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const config = require('../webpack.config.js');
    const compiler = webpack(config);

    app.use(
        webpackDevMiddleware(compiler, {
            publicPath: config.output.publicPath,
            writeToDisk: true,
        })
    );
    app.use(webpackHotMiddleware(compiler));

    compiler.hooks.done.tap('StartServer', () => {
        // Logging for a clean start
    });

} else {
    // --- Production Setup ---

    // Static File Serving (from disk)
    app.use(express.static(path.resolve(__dirname, '..', 'build')));

    // Note: The universal fallback route handles the catch-all for production now.
}

// -----------------------------------------------------------
// UNIVERSAL FALLBACK ROUTE: CRITICAL FOR REACT ROUTER
// -----------------------------------------------------------

// Determinar index path removed for Vercel functions (handled by rewrites)
const indexPath = path.join(process.cwd(), 'build', 'index.html');

// --- About Page Content API ---

// Get About Page Content
app.get('/api/about', (req, res) => {
    fs.readFile(ABOUT_FILE, 'utf8', (err, data) => {
        if (err) {
            // If file doesn't exist, return default structure (or could create it)
            return res.status(500).json({ error: 'Content not found' });
        }
        res.json(JSON.parse(data));
    });
});

// Update About Page Content
app.post('/api/about', authMiddleware, (req, res) => {
    const newContent = req.body;
    fs.writeFile(ABOUT_FILE, JSON.stringify(newContent, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save content' });
        res.json(newContent);
    });
});

// --- Home Page Content API ---

// Get Home Page Content
app.get('/api/home', (req, res) => {
    fs.readFile(HOME_FILE, 'utf8', (err, data) => {
        if (err) {
            // If file doesn't exist, return default structure (or could create it)
            return res.status(500).json({ error: 'Content not found' });
        }
        res.json(JSON.parse(data));
    });
});

// Update Home Page Content
app.post('/api/home', authMiddleware, (req, res) => {
    const newContent = req.body;
    fs.writeFile(HOME_FILE, JSON.stringify(newContent, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save content' });
        res.json(newContent);
    });
});

// --- Footer Content API ---

// Get Footer Content
app.get('/api/footer', (req, res) => {
    fs.readFile(FOOTER_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Content not found' });
        }
        res.json(JSON.parse(data));
    });
});

// Update Footer Content
app.post('/api/footer', authMiddleware, (req, res) => {
    const newContent = req.body;
    fs.writeFile(FOOTER_FILE, JSON.stringify(newContent, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save content' });
        res.json(newContent);
    });
});

// --- Global Settings API ---

interface GlobalSettings {
    logoText?: string;
    logoImage?: string;
    logoAlignment?: string;
    showLogoImage?: boolean;
}

// Get Global Settings
app.get('/api/global', (req: any, res: any) => {
    fs.readFile(GLOBAL_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Content not found' });
        }
        res.json(JSON.parse(data));
    });
});

// Update Global Settings
app.post('/api/global', authMiddleware, upload.single('logoImage'), (req: any, res: any) => {
    fs.readFile(GLOBAL_FILE, 'utf8', (err, data) => {
        let settings: GlobalSettings = {};
        try { settings = JSON.parse(data); } catch (e) { }

        const { logoText, logoAlignment, showLogoImage } = req.body;

        const newSettings: GlobalSettings = {
            ...settings,
            logoText: logoText || settings.logoText,
            logoAlignment: logoAlignment || settings.logoAlignment,
            showLogoImage: showLogoImage === 'true' || showLogoImage === true,
        };

        if (req.file) {
            newSettings.logoImage = `/uploads/${req.file.filename}`;
        }

        fs.writeFile(GLOBAL_FILE, JSON.stringify(newSettings, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save settings' });
            res.json(newSettings);
        });
    });
});

// Serve the frontend
app.get('*', (req, res) => {
    // Ensure the index.html exists before attempting to send it
    if (isDevelopment || path.extname(req.path).length === 0) {
        res.sendFile(indexPath);
    }
});

// Export the app for Vercel serverless
export default app;

// Start the server only if run directly (development) or if not on Vercel
if (isDevelopment || process.env.VITE_DEV === 'true') {
    server.listen(PORT, () => {
        console.log(`\n✅ Server is running in ${process.env.NODE_ENV} mode.`);
        console.log(`🌐 Application available at http://localhost:${PORT}\n`);
    });
}