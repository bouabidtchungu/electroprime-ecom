import React, { useState, useEffect } from 'react';

const AdminPage = () => {
    // Auth State
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');
    const [passwordInput, setPasswordInput] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'content'

    // Product State
    const [products, setProducts] = useState([]);
    const [productForm, setProductForm] = useState({ id: null, title: '', description: '', price: '' });
    const [productImage, setProductImage] = useState(null);
    const [isEditingProduct, setIsEditingProduct] = useState(false);

    // About, Home, & Footer Content State
    const [contentTab, setContentTab] = useState('about');
    const [aboutContent, setAboutContent] = useState({
        hero: { title: 'Our Story', subtitle: 'ElectroPrime', description: 'Experience excellence in electronics.' },
        values: [{ title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }],
        stats: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }]
    });
    const [homeContent, setHomeContent] = useState({ title: '', subtitle: '', description: '', cta: '' });
    const [footerContent, setFooterContent] = useState({ brandName: '', description: '', copyright: '', contact: { email: '', phone: '' } });
    const [globalSettings, setGlobalSettings] = useState({ logoText: 'ElectroPrime', logoAlignment: 'left', showLogoImage: false });
    const [systemHealth, setSystemHealth] = useState({ db: false, cloud: false, loading: true });

    const checkHealth = async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setSystemHealth({ db: data.db, cloud: data.cloud, loading: false });
        } catch { setSystemHealth({ db: false, cloud: false, loading: false }); }
    };

    useEffect(() => {
        if (adminToken) {
            checkHealth();
            fetchProducts();
            fetchAboutContent();
            fetchHomeContent();
            fetchFooterContent();
            fetchGlobalSettings();
        }
    }, [adminToken]);

    const handleLogin = (e) => {
        e.preventDefault();
        localStorage.setItem('adminToken', passwordInput);
        setAdminToken(passwordInput);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setAdminToken('');
        setPasswordInput('');
    };

    // --- Image Compression Helper ---
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1200;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7); // 70% quality
                };
            };
        });
    };

    // --- Product Handlers ---
    const fetchProducts = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch('/api/products', {
                headers: { 'X-Admin-Token': adminToken },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.status === 401) return handleLogout();
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setProducts([]);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true); // Prevent double submission

        let finalImage = productImage;
        if (productImage) {
            finalImage = await compressImage(productImage);
            console.log(`Original: ${(productImage.size / 1024).toFixed(2)}KB, Compressed: ${(finalImage.size / 1024).toFixed(2)}KB`);
        }

        const formData = new FormData();
        formData.append('title', productForm.title || '');
        formData.append('description', productForm.description || '');
        formData.append('price', (productForm.price || 0).toString());
        if (finalImage) formData.append('image', finalImage);

        try {
            const url = isEditingProduct ? `/api/products/${productForm.id}` : '/api/products';
            const method = isEditingProduct ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                body: formData,
                headers: { 'X-Admin-Token': adminToken }
            });
            if (res.status === 401) return handleLogout();

            if (!res.ok) {
                let errorMsg = 'Server error';
                try {
                    const data = await res.json();
                    errorMsg = data.error || errorMsg;
                } catch (e) {
                    errorMsg = `Error ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMsg);
            }

            setProductForm({ id: null, title: '', description: '', price: '' });
            setIsEditingProduct(false);
            setProductImage(null);
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';

            fetchProducts();
            alert('Product saved successfully!');
        } catch (err) { alert('Failed to save: ' + err.message); }
        finally { setIsSaving(false); }
    };

    const handleEditProduct = (product) => {
        setProductForm(product);
        setIsEditingProduct(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Token': adminToken }
            });
            if (res.status === 401) return handleLogout();
            if (!res.ok) throw new Error('Delete failed');
            fetchProducts();
        } catch (err) { alert('Delete failed: ' + err.message); }
    };

    const handleClearAll = async () => {
        if (!window.confirm('WARNING: This will delete ALL products from the database. Are you sure?')) return;
        try {
            const res = await fetch('/api/products-clear-all', {
                method: 'POST',
                headers: { 'X-Admin-Token': adminToken }
            });
            if (res.status === 401) return handleLogout();
            if (!res.ok) throw new Error('Clear failed');
            fetchProducts();
            alert('Inventory cleared!');
        } catch (err) { alert('Clear failed: ' + err.message); }
    };

    // --- About Content Handlers ---
    const fetchAboutContent = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch('/api/about', {
                headers: { 'X-Admin-Token': adminToken },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.status === 401) return handleLogout();
            const data = await res.json();
            setAboutContent(data || {});
        } catch (err) {
            console.error('About fetch error:', err);
            // Default already set in state
        }
    };

    const handleAboutChange = (section, field, value, index = null) => {
        if (!aboutContent) return;
        const newContent = { ...aboutContent };
        if (!newContent[section]) newContent[section] = (section === 'hero' ? {} : []);

        if (section === 'hero') {
            newContent.hero[field] = value;
        } else if ((section === 'values' || section === 'stats') && index !== null) {
            if (!newContent[section][index]) newContent[section][index] = {};
            newContent[section][index][field] = value;
        }
        setAboutContent(newContent);
    };

    const handleSaveAbout = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/about', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify(aboutContent || {})
            });
            if (res.status === 401) return handleLogout();
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Update failed');
            }
            alert('About Page updated successfully!');
        } catch (err) { alert('Save failed: ' + err.message); }
    };

    // --- Home Content Handlers ---
    const fetchHomeContent = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch('/api/home', {
                headers: { 'X-Admin-Token': adminToken },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.status === 401) return handleLogout();
            const data = await res.json();
            setHomeContent(data || {});
        } catch (err) {
            console.error('Home fetch error:', err);
        }
    };

    const handleSaveHome = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/home', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify(homeContent || {})
            });
            if (res.status === 401) return handleLogout();
            if (!res.ok) throw new Error('Update failed');
            alert('Home Page updated successfully!');
        } catch (err) { alert('Save failed: ' + err.message); }
    };

    // --- Footer Content Handlers ---
    const fetchFooterContent = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch('/api/footer', {
                headers: { 'X-Admin-Token': adminToken },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.status === 401) return handleLogout();
            const data = await res.json();
            setFooterContent(data || {});
        } catch (err) {
            console.error('Footer fetch error:', err);
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    // ... (Existing useEffect)

    // ... (Existing fetched functions)

    const handleSaveFooter = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/footer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify(footerContent || {})
            });
            if (res.status === 401) return handleLogout();
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Update failed');
            }
            alert('Footer updated successfully!');
        } catch (err) {
            alert('Save failed: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Global Settings Handlers ---
    const fetchGlobalSettings = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch('/api/global', {
                headers: { 'X-Admin-Token': adminToken },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.status === 401) return handleLogout();
            const data = await res.json();
            setGlobalSettings(data || {});
        } catch (err) {
            console.error('Global settings fetch error:', err);
        }
    };

    const handleSaveGlobal = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        formData.append('logoText', globalSettings.logoText || '');
        formData.append('logoAlignment', globalSettings.logoAlignment || 'left');
        formData.append('showLogoImage', (!!globalSettings.showLogoImage).toString());

        const logoFileInput = document.getElementById('logo-upload');
        if (logoFileInput && logoFileInput.files[0]) {
            const compressedLogo = await compressImage(logoFileInput.files[0]);
            formData.append('logoImage', compressedLogo);
        }

        try {
            const res = await fetch('/api/global', {
                method: 'POST',
                body: formData,
                headers: { 'X-Admin-Token': adminToken }
            });
            if (res.status === 401) return handleLogout();
            if (!res.ok) {
                let errorMsg = 'Failed to save settings';
                try {
                    const data = await res.json();
                    errorMsg = data.error || errorMsg;
                } catch (e) {
                    errorMsg = `Error ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMsg);
            }
            const data = await res.json();
            setGlobalSettings(data);
            alert('Settings updated successfully! Please refresh once to see changes.');
        } catch (err) { alert('Failed to save settings: ' + err.message); }
        finally { setIsSaving(false); }
    };

    if (!adminToken) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-tech-darker">
                <div className="max-w-md w-full bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-800 text-center">
                    <div className="w-20 h-20 bg-tech-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-tech-primary/20">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
                    <p className="text-gray-400 mb-8">Enter your security password to manage the platform.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Secret Password"
                            className="w-full px-5 py-4 bg-gray-800 border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-tech-primary outline-none text-center tracking-widest"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-tech-primary text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-tech-primary/10"
                        >
                            Unlock Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 min-h-screen">
            {/* Health Indicator */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-900/50 backdrop-blur px-4 py-2 rounded-full border border-gray-800 flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest transition-all">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${systemHealth.loading ? 'bg-gray-500 animate-pulse' : systemHealth.db ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                        <span className={systemHealth.db ? 'text-green-500' : 'text-red-500'}>Database: {systemHealth.loading ? '...' : systemHealth.db ? 'OK' : 'OFF'}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-800"></div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${systemHealth.loading ? 'bg-gray-500 animate-pulse' : systemHealth.cloud ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                        <span className={systemHealth.cloud ? 'text-blue-500' : 'text-red-500'}>Cloud: {systemHealth.loading ? '...' : systemHealth.cloud ? 'OK' : 'OFF'}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-800"></div>
                    <button
                        onClick={() => { setSystemHealth({ ...systemHealth, loading: true }); checkHealth(); fetchProducts(); }}
                        className="text-gray-500 hover:text-tech-primary transition-colors flex items-center gap-1"
                        title="Force synchronization"
                    >
                        <span>🔄</span> {systemHealth.loading ? 'SYNCING' : 'REFRESH'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="flex-1" /> {/* Spacer */}
                <h1 className="text-4xl font-bold text-center text-text-heavy">Admin Dashboard</h1>
                <div className="flex-1 flex justify-end">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-red-500 border border-gray-700 rounded-lg transition text-sm font-bold"
                    >
                        Logout 👋
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-12">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-3 rounded-full font-bold transition ${activeTab === 'products' ? 'bg-tech-primary text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    Manage Products
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`px-6 py-3 rounded-full font-bold transition ${activeTab === 'content' ? 'bg-tech-primary text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    Edit Site Content
                </button>
            </div>

            {/* PRODUCT TAB */}
            {activeTab === 'products' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800 h-fit sticky top-24">
                        <h2 className="text-2xl font-bold text-white mb-6">{isEditingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleProductSubmit} className="space-y-6">
                            <input
                                className="w-full px-4 py-3 bg-gray-800 border-gray-700 rounded-xl text-white focus:ring-tech-primary outline-none"
                                placeholder="Title"
                                value={productForm.title}
                                onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-800 border-gray-700 rounded-xl text-white focus:ring-tech-primary outline-none"
                                placeholder="Price"
                                value={productForm.price}
                                onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                required
                            />
                            <textarea
                                className="w-full px-4 py-3 bg-gray-800 border-gray-700 rounded-xl text-white focus:ring-tech-primary outline-none"
                                rows="3"
                                placeholder="Description"
                                value={productForm.description}
                                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                required
                            />
                            {isEditingProduct && productForm.image && (
                                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 mb-2">
                                    <img src={productForm.image} alt="Current" className="w-16 h-16 object-cover rounded-lg" />
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Current Image</p>
                                        <p className="text-white text-xs truncate max-w-[150px]">{productForm.image.split('/').pop()}</p>
                                    </div>
                                </div>
                            )}
                            <input
                                id="file-upload"
                                type="file"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 focus:ring-2 focus:ring-tech-primary outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                                onChange={e => setProductImage(e.target.files[0])}
                                accept="image/*"
                                required={!isEditingProduct}
                            />
                            <button type="submit" className="w-full bg-tech-primary text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition">
                                {isEditingProduct ? 'Update Product' : 'Add Product'}
                            </button>
                            {isEditingProduct && <button type="button" onClick={() => { setIsEditingProduct(false); setProductForm({ id: null, title: '', description: '', price: '' }); }} className="w-full mt-2 text-gray-400 underline">Cancel</button>}
                        </form>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Inventory</h2>
                            {products.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg text-xs font-bold hover:bg-red-800 hover:text-white transition"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {products.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleEditProduct(p)}
                                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-300 group ${productForm.id === p.id ? 'border-tech-primary bg-gray-800 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-700'}`}
                                >
                                    <div className="relative overflow-hidden rounded-lg">
                                        <img src={p.image} alt={p.title} className="w-16 h-16 object-cover transition-transform duration-300 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Edit</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white group-hover:text-tech-primary transition-colors">{p.title}</h3>
                                        <p className="text-tech-primary font-mono text-sm">${p.price}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="hidden sm:block text-xs font-bold text-tech-primary px-3 py-1 rounded bg-tech-primary/10 border border-tech-primary/20 hover:bg-tech-primary hover:text-black transition">
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                            title="Delete Product"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
                <div className="max-w-4xl mx-auto">
                    {/* Content Sub-Tabs */}
                    <div className="flex justify-center gap-4 mb-8 relative z-50">
                        <button
                            onClick={() => setContentTab('about')}
                            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${contentTab === 'about' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >
                            About Page
                        </button>
                        <button
                            onClick={() => setContentTab('home')}
                            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${contentTab === 'home' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >
                            Home Page
                        </button>
                        <button
                            onClick={() => setContentTab('footer')}
                            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${contentTab === 'footer' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >
                            Footer
                        </button>
                        <button
                            onClick={() => setContentTab('logo')}
                            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${contentTab === 'logo' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >
                            Logo & Header
                        </button>
                    </div>

                    {/* ABOUT CONTENT */}
                    {contentTab === 'about' && (
                        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Edit About Page</h2>
                            <form onSubmit={handleSaveAbout} className="space-y-8">
                                {/* Hero Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl text-tech-primary font-bold">1. Hero Section</h3>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Main Heading</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={aboutContent.hero?.title || ''}
                                            onChange={e => handleAboutChange('hero', 'title', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Subtitle</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={aboutContent.hero?.subtitle || ''}
                                            onChange={e => handleAboutChange('hero', 'subtitle', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Intro Description</label>
                                        <textarea
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            rows="3"
                                            value={aboutContent.hero?.description || ''}
                                            onChange={e => handleAboutChange('hero', 'description', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Values Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl text-tech-primary font-bold">2. Our Values (3 Columns)</h3>
                                    {(aboutContent.values || []).map((val, idx) => (
                                        <div key={idx} className="p-4 border border-gray-700 rounded-xl bg-gray-800/30">
                                            <h4 className="text-white font-semibold mb-2">Value #{idx + 1}</h4>
                                            <input
                                                className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white mb-2 outline-none focus:border-tech-primary"
                                                placeholder="Title (e.g. Innovation First)"
                                                value={val.title || ''}
                                                onChange={e => handleAboutChange('values', 'title', e.target.value, idx)}
                                            />
                                            <textarea
                                                className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                                rows="2"
                                                placeholder="Description"
                                                value={val.description || ''}
                                                onChange={e => handleAboutChange('values', 'description', e.target.value, idx)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Stats Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl text-tech-primary font-bold">3. Key Stats</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(aboutContent.stats || []).map((stat, idx) => (
                                            <div key={idx} className="p-4 border border-gray-700 rounded-xl bg-gray-800/30">
                                                <h4 className="text-white font-semibold mb-2">Stat #{idx + 1}</h4>
                                                <input
                                                    className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white mb-2 outline-none focus:border-tech-primary"
                                                    placeholder="Value (e.g. 10k+)"
                                                    value={stat.value || ''}
                                                    onChange={e => handleAboutChange('stats', 'value', e.target.value, idx)}
                                                />
                                                <input
                                                    className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                                    placeholder="Label (e.g. Products Sold)"
                                                    value={stat.label || ''}
                                                    onChange={e => handleAboutChange('stats', 'label', e.target.value, idx)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-tech-secondary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition">Save About Page</button>
                            </form>
                        </div>
                    )}

                    {/* HOME CONTENT */}
                    {contentTab === 'home' && (
                        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Edit Home Page</h2>
                            <form onSubmit={handleSaveHome} className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl text-tech-primary font-bold">Hero Section</h3>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Title</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={homeContent.title || ''}
                                            onChange={e => setHomeContent({ ...homeContent, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Subtitle</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={homeContent.subtitle || ''}
                                            onChange={e => setHomeContent({ ...homeContent, subtitle: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Description</label>
                                        <textarea
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            rows="3"
                                            value={homeContent.description || ''}
                                            onChange={e => setHomeContent({ ...homeContent, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">CTA Button Text</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={homeContent.cta || ''}
                                            onChange={e => setHomeContent({ ...homeContent, cta: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-tech-secondary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition">Save Home Page</button>
                            </form>
                        </div>
                    )}

                    {/* FOOTER CONTENT */}
                    {contentTab === 'footer' && (
                        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Edit Footer</h2>
                            <form onSubmit={handleSaveFooter} className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl text-tech-primary font-bold">General Info</h3>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Brand Name</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={footerContent.brandName || ''}
                                            onChange={e => setFooterContent({ ...footerContent, brandName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Short Description</label>
                                        <textarea
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            rows="3"
                                            value={footerContent.description || ''}
                                            onChange={e => setFooterContent({ ...footerContent, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Copyright Text</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={footerContent.copyright || ''}
                                            onChange={e => setFooterContent({ ...footerContent, copyright: e.target.value })}
                                        />
                                    </div>

                                    <h3 className="text-xl text-tech-primary font-bold mt-6">Contact Info</h3>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Email</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={footerContent.contact?.email || ''}
                                            onChange={e => setFooterContent({ ...footerContent, contact: { ...footerContent.contact, email: e.target.value } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Phone</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={footerContent.contact?.phone || ''}
                                            onChange={e => setFooterContent({ ...footerContent, contact: { ...footerContent.contact, phone: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`w-full font-bold py-4 rounded-xl shadow-lg transition ${isSaving ? 'bg-gray-600 cursor-not-allowed' : 'bg-tech-secondary hover:bg-blue-600'} text-white`}
                                >
                                    {isSaving ? 'Saving...' : 'Save Footer Content'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* LOGO & GLOBAL SETTINGS */}
                    {contentTab === 'logo' && (
                        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Logo & Header Settings</h2>
                            <form onSubmit={handleSaveGlobal} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Logo Text</label>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-white outline-none focus:border-tech-primary"
                                            value={globalSettings.logoText || ''}
                                            onChange={e => setGlobalSettings({ ...globalSettings, logoText: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center gap-4 p-4 border border-gray-800 rounded-xl bg-gray-800/30">
                                        <div className="flex-1">
                                            <h4 className="text-white font-semibold">Enable Logo Image</h4>
                                            <p className="text-gray-400 text-sm">Should an image be displayed next to the text?</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setGlobalSettings({ ...globalSettings, showLogoImage: !globalSettings.showLogoImage })}
                                            className={`w-14 h-8 rounded-full transition-colors relative ${globalSettings.showLogoImage ? 'bg-tech-primary' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${globalSettings.showLogoImage ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {globalSettings.showLogoImage && (
                                        <div className="p-4 border border-gray-800 rounded-xl bg-gray-800/30 space-y-4">
                                            <label className="block text-gray-400 text-sm mb-1">Logo Image</label>
                                            {globalSettings.logoImage && (
                                                <img src={globalSettings.logoImage} alt="Current Logo" className="h-12 w-auto object-contain bg-gray-900 rounded p-2" />
                                            )}
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-gray-700 file:text-white"
                                                accept="image/*"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Header Alignment</label>
                                        <div className="flex gap-4">
                                            {['left', 'center'].map(align => (
                                                <button
                                                    key={align}
                                                    type="button"
                                                    onClick={() => setGlobalSettings({ ...globalSettings, logoAlignment: align })}
                                                    className={`flex-1 py-3 rounded-xl font-bold border transition ${globalSettings.logoAlignment === align ? 'bg-tech-primary text-black border-tech-primary' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
                                                >
                                                    {align === 'left' ? 'Left Aligned' : 'Centered'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`w-full font-bold py-4 rounded-xl shadow-lg transition ${isSaving ? 'bg-gray-600 cursor-not-allowed' : 'bg-tech-secondary hover:bg-blue-600'} text-white`}
                                >
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default AdminPage;
