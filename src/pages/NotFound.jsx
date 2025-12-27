import React from 'react';
import { Link } from 'react-router-dom';
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base text-center">
    <h1 className="text-9xl font-extrabold text-tech-primary">404</h1>
    <p className="text-3xl font-semibold text-text-heavy mb-4">Page Not Found</p>
    <p className="text-lg text-text-light mb-8">The resource you requested could not be located.</p>
    <Link to="/" className="bg-tech-secondary text-white py-3 px-6 rounded-lg font-bold hover:bg-opacity-90 transition">
      Go to Home Page
    </Link>
  </div>
);
export default NotFound;