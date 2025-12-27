import React from 'react';
import { motion } from 'framer-motion';

// Dummy data for cart items to test the layout immediately
const DUMMY_CART_ITEMS = [
    { id: 1, name: "Aurora Smartwatch", price: 349.99, quantity: 1 },
    { id: 2, name: "X-Series Headset", price: 199.50, quantity: 2 },
];

// Helper component for displaying a single item in the cart
const CartItem = ({ item }) => (
    <div className="flex justify-between items-center py-4 border-b border-ui-border last:border-b-0">
        <div className="flex items-center space-x-4">
            {/* Placeholder Image */}
            <img src={`https://via.placeholder.com/80x80?text=${item.id}`} alt={item.name} className="w-20 h-20 object-cover rounded" />
            <div>
                <h3 className="text-lg font-semibold text-text-heavy">{item.name}</h3>
                <p className="text-text-light">Qty: {item.quantity}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-xl font-bold text-tech-primary">${(item.price * item.quantity).toFixed(2)}</p>
            <button className="text-sm text-red-500 hover:text-red-700 transition mt-1">Remove</button>
        </div>
    </div>
);

const CartPage = () => {
    // In the next step, this will come from global state (Redux/Context)
    const cartItems = DUMMY_CART_ITEMS; 
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax placeholder
    const total = subtotal + tax;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }} 
            className="container mx-auto px-4 py-12"
        >
            <h1 className="text-4xl font-bold text-text-heavy mb-8">Your Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Cart Items List - Two-thirds width on large screens */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    {cartItems.length > 0 ? (
                        cartItems.map(item => (
                            <CartItem key={item.id} item={item} />
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-2xl text-text-light">Your cart is empty.</p>
                            <p className="text-md text-text-light mt-2">Time to find your next tech companion!</p>
                        </div>
                    )}
                </div>

                {/* Order Summary - One-third width on large screens */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
                    <h2 className="text-2xl font-bold text-text-heavy mb-6 border-b pb-3">Order Summary</h2>
                    <div className="space-y-3 text-text-heavy">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>FREE</span>
                        </div>
                        <div className="flex justify-between border-b pb-3">
                            <span>Tax (5%):</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-3 text-2xl font-extrabold text-tech-primary">
                            <span>Order Total:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button className="w-full mt-8 bg-tech-primary text-white font-bold py-3 rounded-lg transition hover:bg-[#005c93]">
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CartPage;