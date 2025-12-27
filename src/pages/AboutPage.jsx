import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AboutPage = () => {
    const [content, setContent] = useState(null);

    useEffect(() => {
        fetch('/api/about')
            .then(res => res.json())
            .then(data => setContent(data))
            .catch(err => console.error(err));
    }, []);

    if (!content) return <div className="min-h-screen bg-bg-base text-white flex items-center justify-center">Loading story...</div>;

    const { hero, values, stats } = content;

    return (
        <div className="min-h-screen bg-bg-base text-gray-300">
            {/* Hero Section */}
            <section className="relative py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-tech-primary font-bold tracking-widest uppercase text-sm mb-4 inline-block"
                    >
                        {hero.subtitle}
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black text-white mb-8"
                    >
                        {hero.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl max-w-2xl mx-auto leading-relaxed text-gray-400"
                    >
                        {hero.description}
                    </motion.p>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-24 bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {values.map((val, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="bg-gray-800 p-10 rounded-3xl border border-gray-700 hover:border-tech-primary/50 transition duration-300 shadow-xl"
                            >
                                <div className="w-16 h-16 bg-tech-primary/10 rounded-2xl flex items-center justify-center mb-8">
                                    <span className="text-2xl text-tech-primary font-bold">{idx + 1}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{val.title}</h3>
                                <p className="leading-relaxed text-gray-400">
                                    {val.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 border-y border-gray-800">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, idx) => (
                            <div key={idx}>
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                                <div className="text-tech-primary font-bold uppercase tracking-wider text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;