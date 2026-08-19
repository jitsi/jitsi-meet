import React from 'react';
import { createRoot } from 'react-dom/client';

import type { MediaCastSignal, MediaCastSignalHandler } from '../../../modules/media-cast/types';

import DocumentPiP from './DocumentPiP';

const { api } = window.alwaysOnTop;
const pendingSignals: MediaCastSignal[] = [];
let receiverSignalHandler: MediaCastSignalHandler | undefined;

const onSignal = ({ signal }: { signal: MediaCastSignal; }) => {
    if (receiverSignalHandler) {
        receiverSignalHandler(signal);
    } else {
        pendingSignals.push(signal);
    }
};
const registerSignalHandler = (handler: MediaCastSignalHandler) => {
    receiverSignalHandler = handler;

    for (const signal of pendingSignals.splice(0)) {
        handler(signal);
    }

    return () => {
        if (receiverSignalHandler === handler) {
            receiverSignalHandler = undefined;
        }
    };
};
const sendSignal = (signal: MediaCastSignal) => api._sendDocumentPiPSignal(signal);

api.on('_documentPiPSignal', onSignal);

const root = createRoot(document.getElementById('react') as HTMLElement);

root.render(
    <DocumentPiP
        registerSignalHandler = { registerSignalHandler }
        sendSignal = { sendSignal } />
);

let cleanedUp = false;
const cleanup = () => {
    if (cleanedUp) {
        return;
    }

    cleanedUp = true;
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('pagehide', cleanup);
    api.removeListener('_documentPiPSignal', onSignal);
    receiverSignalHandler = undefined;
    pendingSignals.length = 0;
    root.unmount();
};

window.addEventListener('beforeunload', cleanup, { once: true });
window.addEventListener('pagehide', cleanup, { once: true });
