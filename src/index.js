import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/cartSlice';
import App from './pages/App';
import './styles/main.css';

// Standard DOM query to find the element where the app will live (usually in index.html)
const rootElement = document.getElementById('root');

// Create a React root and render the main App component inside it
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
} else {
    console.error("Failed to find the root element with ID 'root'");
}