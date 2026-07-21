import React from 'react';
import { useSelector } from 'react-redux';

import { browser } from '../../base/lib-jitsi-meet';
import { isDocumentPiPSupported, shouldShowPiP } from '../functions';

import { DocumentPiPContent } from './DocumentPiPContent';
import PiPVideoElement from './PiPVideoElement';

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    const showPiP = useSelector(shouldShowPiP);

    if (!showPiP) {
        return null;
    }

    // Electron's Chromium also exposes documentPictureInPicture, this will help PiPVideoElement to be the always PiP choice for Electron.
    if (browser.isElectron()) {
        return <PiPVideoElement />;
    }

    if (isDocumentPiPSupported()) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
