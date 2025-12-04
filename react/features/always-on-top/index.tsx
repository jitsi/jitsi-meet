import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import AlwaysOnTop from './AlwaysOnTop';

const container = document.getElementById('react')!;
const root: Root = createRoot(container);

// Render the main/root Component in React 18
root.render(<AlwaysOnTop />);

// Handle unmount on beforeunload
window.addEventListener('beforeunload', () => {
    root.unmount();
});
