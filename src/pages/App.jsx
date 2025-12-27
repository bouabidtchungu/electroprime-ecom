import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Standard imports for components
import Layout from './Layout';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import CartPage from './CartPage';
import NotFound from './NotFound';
import AdminPage from './AdminPage';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Layout wraps all pages */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;