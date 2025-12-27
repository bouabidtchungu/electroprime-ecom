import React from 'react';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom'; // Outlet renders child routes

const Header = () => (
  <header className="bg-text-heavy text-white shadow-md">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-tech-primary hover:text-white transition">
        ElectroPrime
      </Link>
      <nav className="space-x-6">
        <Link to="/" className="hover:text-tech-secondary transition">Home</Link>
        <Link to="/about" className="hover:text-tech-secondary transition">About Us</Link>
        <Link to="/cart" className="hover:text-tech-secondary transition">Cart</Link>
      </nav>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-bg-dark text-gray-400 py-6 mt-10">
    <div className="container mx-auto px-4 text-center">
      <p>&copy; {new Date().getFullYear()} ElectroPrime E-commerce. All rights reserved.</p>
    </div>
  </footer>
);

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* The Outlet component renders the specific child page (Home, About, Cart) */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;