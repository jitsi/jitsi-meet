/**
 * Entry point for the Document PiP window renderer.
 *
 * Bootstraps the React tree into the PiP window document and unmounts it when
 * the window is closed or reloaded.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';

import DocumentPiP from './DocumentPiP';

/**
 * React root attached to the Document PiP window document.
 */
const root = createRoot(document.getElementById('react') as HTMLElement);

root.render(<DocumentPiP />);

/**
 * Whether the renderer has already been cleaned up.
 */
let cleanedUp = false;

/**
 * Unmounts the Document PiP renderer before the PiP window is closed or reloaded.
 *
 * @returns {void}
 */
const cleanup = () => {
    if (cleanedUp) {
        return;
    }

    cleanedUp = true;
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('pagehide', cleanup);
    root.unmount();
};

window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);
