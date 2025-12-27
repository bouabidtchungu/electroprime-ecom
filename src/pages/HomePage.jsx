import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/cartSlice';

const HERO_CONTENT = {
    title: "The Future is Now.",
    subtitle: "Premium Engineering",
    description: "Experience the pinnacle of technology. Meticulously crafted electronics designed to elevate your everyday.",
    cta: "Explore Collection"
};

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [heroContent, setHeroContent] = useState(HERO_CONTENT);
    const dispatch = useDispatch();

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const prodRes = await fetch('/api/products');
                if (!prodRes.ok) throw new Error('API unreachable');
                const prodData = await prodRes.json();
                setProducts(prodData);

                const homeRes = await fetch('/api/home');
                if (homeRes.ok) {
                    const homeData = await homeRes.json();
                    if (homeData && homeData.title) setHeroContent(homeData);
                }
            } catch (err) {
                console.error(err);
                setError('Could not connect to the store API.');
            }
        };
        fetchAll();
    }, []);

    if (error) return <div className="min-h-screen bg-bg-base text-red-500 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Offline Mode</h2>
        <p>{error}</p>
        <p className="mt-2 text-sm text-gray-500">Is the backend server running on Render?</p>
    </div>;

    const handleAddToCart = (product) => {
        dispatch(addItem({
            id: product.id,
            name: product.title,
            price: product.price
        }));
        alert('Added to cart!');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-bg-base"
        >
            {/* 1. Hero Section - Dark & Bold */}
            <section className="relative py-32 md:py-48 overflow-hidden">
                {/* Abstract Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0" />
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-tech-primary/10 to-transparent blur-3xl rounded-full transform translate-x-1/3" />

                <div className="container mx-auto px-6 relative z-10 text-center md:text-left">
                    <div className="max-w-3xl">
                        <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-3 py-1 mb-6 text-sm font-bold tracking-widest text-tech-primary uppercase border border-tech-primary/30 rounded-full bg-tech-primary/10"
                        >
                            {heroContent.subtitle}
                        </motion.span>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tight"
                        >
                            {heroContent.title}
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-2xl"
                        >
                            {heroContent.description}
                        </motion.p>
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-tech-primary text-black font-bold py-4 px-12 rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transform hover:-translate-y-1"
                        >
                            {heroContent.cta}
                        </motion.button>
                    </div>
                </div>
            </section>

            {/* 2. Featured Products Section - Grid Layout */}
            <section id="products" className="container mx-auto px-6 py-24">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-2">Featured Collection</h2>
                        <div className="h-1 w-24 bg-tech-primary rounded-full"></div>
                    </div>
                    <p className="text-gray-400 mt-4 md:mt-0 max-w-md text-right hidden md:block">
                        Hand-picked items that represent the best in modern engineering and aesthetics.
                    </p>
                </div>

                {products.length === 0 ? (
                    <div className="text-center text-gray-500 py-32 border border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
                        <p className="text-xl animate-pulse">Loading premium selection...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 hover:border-tech-primary/50 transition-all duration-300 shadow-2xl hover:shadow-tech-primary/20 flex flex-col h-full"
                            >
                                {/* Image Container */}
                                <div className="h-80 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10 opacity-60" />
                                    <img
                                        src={product.image || 'https://via.placeholder.com/800x600?text=Premium+Product'}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-gray-700">
                                        <span className="text-tech-primary font-bold tracking-wide">${parseFloat(product.price).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex flex-col flex-grow relative z-20">
                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-tech-primary transition-colors">{product.title}</h3>
                                    <p className="text-gray-400 mb-8 line-clamp-3 leading-relaxed flex-grow">{product.description}</p>

                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-tech-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-3 group-hover:shadow-lg"
                                    >
                                        <span className="text-lg">Add to Cart</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </motion.div>
    );
};

export default HomePage;