// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Adjust the import according to your App's location
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
