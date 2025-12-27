import { createSlice, configureStore } from '@reduxjs/toolkit';

// --- 1. Define the Cart Slice (The logic for how the cart state changes) ---

const initialState = {
    items: [],
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        // Reducer to add a product or increase quantity if it exists
        addItem: (state, action) => {
            const { id, name, price } = action.payload;
            const existingItem = state.items.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ id, name, price, quantity: 1 });
            }
        },
        // Reducer to remove a single unit of a product
        removeItem: (state, action) => {
            const id = action.payload;
            const existingItem = state.items.find(item => item.id === id);

            if (existingItem) {
                if (existingItem.quantity === 1) {
                    // Remove the item entirely if quantity is 1
                    state.items = state.items.filter(item => item.id !== id);
                } else {
                    // Decrease quantity
                    existingItem.quantity -= 1;
                }
            }
        },
        // Reducer to completely clear an item from the cart
        clearItem: (state, action) => {
            const id = action.payload;
            state.items = state.items.filter(item => item.id !== id);
        },
        // Reducer to clear the entire cart
        clearCart: (state) => {
            state.items = [];
        }
    }
});

// Export the actions so components can use them
export const { addItem, removeItem, clearItem, clearCart } = cartSlice.actions;

// --- 2. Configure the Redux Store ---

export const store = configureStore({
    reducer: {
        cart: cartSlice.reducer, // Connect the cart reducer to the store
    },
    // We disable devtools in production for security, but keep it for development
    devTools: process.env.NODE_ENV !== 'production',
});