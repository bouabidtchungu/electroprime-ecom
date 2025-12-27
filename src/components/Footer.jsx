import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-text-heavy text-white mt-12 py-10 border-t border-ui-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Column 1: Logo & Copyright */}
          <div>
            <h4 className="text-xl font-bold mb-4 text-tech-primary">ElectroPrime</h4>
            <p className="text-sm text-gray-400">
              Powering your ideas with the latest in technology.
              <br/>
              © 2025 All Rights Reserved.
            </p>
          </div>

          {/* Column 2: Customer Service Links */}
          <div>
            <h4 className="font-semibold mb-4 uppercase">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-gray-400 hover:text-tech-primary transition">Contact Us</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-tech-primary transition">Support Center</Link></li>
              <li><Link to="/returns" className="text-gray-400 hover:text-tech-primary transition">Returns & Exchanges</Link></li>
              <li><Link to="/shipping" className="text-gray-400 hover:text-tech-primary transition">Shipping Policy</Link></li>
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div>
            <h4 className="font-semibold mb-4 uppercase">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-tech-primary transition">Our Story</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-tech-primary transition">Careers</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-tech-primary transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-tech-primary transition">Terms of Use</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 uppercase">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-4">Get exclusive deals and new product alerts.</p>
            <form>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full p-2 rounded bg-[#333] border-none text-white focus:ring-tech-primary focus:ring-1"
              />
              <button 
                type="submit" 
                className="w-full mt-2 bg-tech-primary font-bold py-2 rounded transition duration-200 hover:bg-[#005c93]"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;