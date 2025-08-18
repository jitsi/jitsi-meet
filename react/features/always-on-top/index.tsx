import React from 'react';
import { createRoot } from 'react-dom/client';

import AlwaysOnTop from './AlwaysOnTop';

const root = createRoot(document.getElementById('react')!);

root.render(
    <AlwaysOnTop />
);

window.addEventListener('beforeunload', () => {
    root.unmount();
});
