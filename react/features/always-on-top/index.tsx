import React from 'react';
import { createRoot } from 'react-dom/client';

import AlwaysOnTop from './AlwaysOnTop';

// Render the main/root Component.
/* eslint-disable-next-line react/no-deprecated */
const container = document.getElementById('react');
const root = container ? createRoot(container) : null;

if (root) {
    root.render(<AlwaysOnTop />);
}

window.addEventListener(
    'beforeunload',
    /* eslint-disable-next-line react/no-deprecated */
    () => {
        if (root) {
            root.unmount();
        }
    });
