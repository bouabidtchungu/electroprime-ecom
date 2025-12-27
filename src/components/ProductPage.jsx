import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MOCK_PRODUCT_DATA = {
  id: 'LAP1001',
  name: 'Vortex UltraBook X1 Pro',
  brand: 'InnovaTech',
  price: 1999.99,
  original_price: 2499.99,
  rating: 4.8,
  reviews_count: 125,
  images: [
    'https://via.placeholder.com/600x400/0077B6/FFFFFF?text=Product+View+1',
    'https://via.placeholder.com/600x400/0077B6/FFFFFF?text=Product+View+2',
  ],
  description: 'The UltraBook X1 Pro delivers unparalleled power in an ultra-slim chassis, perfect for professional creatives and demanding developers.',
  features: [
    { key: 'Processor', value: 'Intel Core i9-14900HX', explanation: 'Top-tier performance for seamless multitasking and heavy-duty rendering.' },
    { key: 'RAM', value: '32GB DDR5 (6400MHz)', explanation: 'Future-proof memory that dramatically reduces loading times for large applications and games.' },
    { key: 'Storage', value: '2TB NVMe SSD', explanation: 'Blazing-fast storage for instant boot-ups and rapid file access, ensuring maximum productivity.' },
    { key: 'Display', value: '16" 4K OLED (120Hz)', explanation: 'Vibrant, color-accurate display with high refresh rate—perfect for design work and video editing.' },
    { key: 'Ports', value: '2x Thunderbolt 5, HDMI 2.1', explanation: 'Maximum connectivity with the latest standard for ultra-fast data transfer and multi-monitor setups.' },
  ],
};

const FeatureTooltip = ({ feature }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span className="cursor-help font-semibold text-text-heavy underline decoration-dashed decoration-tech-primary/50 hover:text-tech-primary transition">
        {feature.key}
      </span>

      {isHovering && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-50 top-full mt-2 w-72 p-4 bg-bg-base border border-ui-border rounded-lg shadow-card-lift"
        >
          <p className="text-sm font-bold text-tech-primary mb-1">{feature.key}</p>
          <p className="text-xs text-text-light">{feature.explanation}</p>
        </motion.div>
      )}
    </div>
  );
};

const ProductPage = () => {
  const [product, setProduct] = useState(MOCK_PRODUCT_DATA);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [isLoading, setIsLoading] = useState(false);

  const purchaseBlockVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const tabs = [
    { id: 'description', name: 'Description' },
    { id: 'full-specs', name: 'Full Specs' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'support', name: 'Support' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return <p className="text-text-light leading-relaxed">{product.description}</p>;
      case 'full-specs':
        return <p className="text-text-light">**FULL SPECS TABLE GOES HERE** (A detailed table with all features.)</p>;
      case 'reviews':
        return <p className="text-text-light">**REVIEW LIST GOES HERE** (Displays user reviews.)</p>;
      case 'support':
        return <p className="text-text-light">**WARRANTY & SUPPORT INFO GOES HERE** (Returns, warranty, etc.)</p>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-bg-base">
        <p className="text-text-heavy">Loading Breakthrough Device...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base font-sans pt-10 pb-20">
      <div className="container mx-auto px-4 lg:px-8">
        <p className="text-sm text-text-light mb-6">
            Home &gt; Computers &gt; Laptops &gt; <span className="text-tech-primary">{product.name}</span>
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-6 rounded-xl shadow-card-lift">
          <div className="flex flex-col">
            {/* Main Image View */}
            <div className="aspect-video mb-4 overflow-hidden rounded-lg border border-ui-border">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {/* Thumbnails */}
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((img, index) => (
                <img 
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-20 h-20 object-cover cursor-pointer rounded-md transition duration-200 ${img === activeImage ? 'border-2 border-tech-primary' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveImage(img)}
                />
              ))}
            </div>
          </div>

          <motion.div
            variants={purchaseBlockVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl font-extrabold text-text-heavy mb-2 leading-tight">{product.name}</h1>
            <p className="text-lg text-text-light mb-4">{product.brand}</p>

            {/* Rating */}
            <div className="flex items-center mb-6">
                <span className="text-xl text-tech-secondary mr-2">★★★★★</span>
                <span className="text-text-light">({product.rating} / {product.reviews_count} Reviews)</span>
            </div>

            {/* Pricing Block */}
            <div className="mb-8 border-t border-b border-ui-border py-4">
                {product.original_price && (
                    <p className="text-sm text-text-light line-through">MSRP: ${product.original_price}</p>
                )}
                <h2 className="text-5xl font-bold text-text-heavy mb-1">${product.price.toFixed(2)}</h2>
                {product.original_price && (
                    <span className="bg-tech-secondary text-white text-xs font-bold py-1 px-2 rounded">
                        SAVE {((product.original_price - product.price) / product.original_price * 100).toFixed(0)}%
                    </span>
                )}
            </div>

            {/* Key Features (with tooltips) */}
            <h3 className="text-xl font-semibold text-text-heavy mb-4">Key Features</h3>
            <ul className="space-y-3 mb-10">
              {product.features.map((feature, index) => (
                <li key={index} className="flex justify-between items-start text-base text-text-light border-b border-ui-border/50 pb-2 last:border-b-0">
                    <FeatureTooltip feature={feature} />
                    <span className="font-medium text-text-heavy">{feature.value}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex space-x-4 mb-4">
              <button className="flex-1 bg-tech-primary text-white font-bold py-3 px-6 rounded-lg text-lg uppercase transition duration-300 hover:shadow-button-hover hover:bg-[#005c93]">
                Add to Cart
              </button>
              <button className="flex-1 bg-gray-200 text-text-heavy font-bold py-3 px-6 rounded-lg text-lg uppercase transition duration-300 hover:bg-gray-300">
                Buy Now
              </button>
            </div>
            <div className="text-center text-sm text-ui-success font-medium">
                ✓ Free shipping. Estimated Delivery: Tomorrow.
            </div>
          </motion.div>
        </div>

        {/* Description/Specs/Reviews Tabs */}
        <div className="mt-12">
            <div className="flex border-b border-ui-border mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-6 transition duration-200 font-semibold text-lg ${
                            activeTab === tab.id
                                ? 'text-tech-primary border-b-4 border-tech-primary'
                                : 'text-text-light hover:text-tech-primary'
                        }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>
            <div className="p-6 bg-white rounded-b-xl shadow-card-lift">
                {renderTabContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;