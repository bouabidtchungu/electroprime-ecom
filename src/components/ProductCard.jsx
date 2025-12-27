import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from './Icons'; // Imports the cart icon

// Helper component to render star ratings based on a number
const RatingStars = ({ rating }) => {
  const filledStars = Math.round(rating);
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`text-xl ${i <= filledStars ? 'text-tech-secondary' : 'text-ui-border'}`}>
        ★
      </span>
    );
  }
  return <div className="flex items-center space-x-0.5">{stars}</div>;
};

const ProductCard = ({ product }) => {
  if (!product) return null;
  const productPath = `/product/${product.slug || product.id}`; 

  return (
    <div className="bg-white rounded-xl shadow-card-lift overflow-hidden hover:shadow-xl transition duration-300 flex flex-col h-full">

      {/* 1. Product Image & Link */}
      <Link to={productPath} className="block overflow-hidden aspect-video">
        <img 
          src={product.image || 'https://via.placeholder.com/400x300?text=ElectroPrime+Product'} 
          alt={product.name} 
          className="w-full h-full object-cover transition duration-500 transform hover:scale-105" 
        />
      </Link>

      {/* 2. Product Details */}
      <div className="p-4 flex flex-col flex-grow">

        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-text-heavy leading-snug hover:text-tech-primary transition flex-grow">
              <Link to={productPath}>
                {product.name}
              </Link>
            </h3>
        </div>

        {/* Rating */}
        <div className="mb-3">
            <RatingStars rating={product.rating || 0} />
            <span className="text-sm text-text-light ml-1">({product.rating.toFixed(1)})</span>
        </div>

        {/* Price */}
        <p className="text-3xl font-bold text-tech-primary mt-auto">${product.price.toFixed(2)}</p>

        {/* CTA Buttons */}
        <div className="mt-4 flex space-x-3">
          <Link 
            to={productPath} 
            className="flex-1 text-center border border-tech-primary text-tech-primary font-medium py-2 rounded-lg text-sm hover:bg-tech-primary hover:text-white transition duration-200"
          >
            View Details
          </Link>
          <button 
            className="w-12 bg-tech-secondary text-white rounded-lg flex items-center justify-center hover:bg-opacity-80 transition duration-200"
            aria-label="Add to Cart"
          >
            <ShoppingCartIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;