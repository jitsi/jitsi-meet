import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client'; // New import for React 18
import AlwaysOnTop from './AlwaysOnTop';

// CHANGED: Create and store the root instance
const rootElement = document.getElementById('react') ?? document.body;
const root = createRoot(rootElement);

// CHANGED: Replace ReactDOM.render with root.render
root.render(<AlwaysOnTop />);

window.addEventListener(
    'beforeunload',
    () => {
        // CHANGED: Replace ReactDOM.unmountComponentAtNode with root.unmount
        root.unmount();
    }
);