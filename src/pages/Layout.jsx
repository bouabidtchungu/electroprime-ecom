import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Layout = () => {
    const { items } = useSelector(state => state.cart);
    const cartCount = items.reduce((total, item) => total + item.quantity, 0);
    const location = useLocation();
    const [footerContent, setFooterContent] = React.useState(null);
    const [globalSettings, setGlobalSettings] = React.useState(null);

    React.useEffect(() => {
        fetch('/api/footer')
            .then(res => res.json())
            .then(data => setFooterContent(data))
            .catch(err => console.error(err));

        fetch('/api/global')
            .then(res => res.json())
            .then(data => setGlobalSettings(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-base text-text-light font-sans">
            <header className="bg-gray-900/90 backdrop-blur-md border-b border-ui-border sticky top-0 z-50">
                <nav className={`container mx-auto px-6 py-4 flex ${globalSettings?.logoAlignment === 'center' ? 'flex-col md:flex-row md:justify-between items-center' : 'justify-between items-center'}`}>
                    <Link to="/" className={`text-3xl font-extrabold text-text-heavy tracking-tighter flex items-center gap-3 ${globalSettings?.logoAlignment === 'center' ? 'mb-4 md:mb-0' : ''}`}>
                        {globalSettings?.showLogoImage && globalSettings?.logoImage && (
                            <img src={globalSettings.logoImage} alt="Logo" className="h-8 w-auto object-contain" />
                        )}
                        <span>{globalSettings?.logoText || 'ElectroPrime'}</span>
                    </Link>

                    <div className="flex items-center space-x-8">
                        <Link to="/" className={`font-medium text-lg transition duration-200 ${location.pathname === '/' ? 'text-tech-primary' : 'text-text-light hover:text-white'}`}>
                            Home
                        </Link>
                        <Link to="/about" className={`font-medium text-lg transition duration-200 ${location.pathname === '/about' ? 'text-tech-primary' : 'text-text-light hover:text-white'}`}>
                            About
                        </Link>
                        <Link to="/admin" className={`font-medium text-lg transition duration-200 ${location.pathname === '/admin' ? 'text-tech-primary' : 'text-text-light hover:text-white'}`}>
                            Admin
                        </Link>
                        <Link to="/cart" className="relative group">
                            <span className="sr-only">Cart</span>
                            <div className="p-2 rounded-full hover:bg-gray-800 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-light group-hover:text-tech-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-tech-primary text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform scale-90 group-hover:scale-100 transition">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="flex-grow">
                <Outlet />
            </main>

            <footer className="bg-black text-text-light py-16 border-t border-ui-border">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold mb-6 text-white">{footerContent?.brandName || 'ElectroPrime'}</h3>
                            <p className="text-gray-400 leading-relaxed max-w-sm">
                                {footerContent?.description || 'Elevating your digital lifestyle with premium electronics.'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold mb-6 text-white">Explore</h4>
                            <ul className="space-y-4">
                                <li><Link to="/" className="hover:text-tech-primary transition duration-200">Featured Collection</Link></li>
                                <li><Link to="/about" className="hover:text-tech-primary transition duration-200">Our Story</Link></li>
                                <li><Link to="/cart" className="hover:text-tech-primary transition duration-200">Shopping Cart</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold mb-6 text-white">Contact</h4>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <span className="text-tech-primary">✉</span> {footerContent?.contact?.email || 'support@electroprime.com'}
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-tech-primary">📞</span> {footerContent?.contact?.phone || '+1 (800) 555-0123'}
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>{footerContent?.copyright || '© 2024 ElectroPrime. All rights reserved.'}</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
