import React from 'react';
import { useSelector } from 'react-redux';

import { browser } from '../../base/lib-jitsi-meet';
import { isEmbedded } from '../../base/util/embedUtils';
import { isDocumentPiPSupported, shouldShowPiP } from '../functions';
import { useDocumentPiPMediaSession } from '../hooks';

import PiPVideoElement from './PiPVideoElement';
import { DocumentPiPContent } from './web/DocumentPiPContent';

/**
 * Document PiP support cannot change during the page lifetime, so it is computed once at module
 * load instead of on every render.
 */
const IS_DOCUMENT_PIP_SUPPORTED = isDocumentPiPSupported();

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 * Embedded meetings defer to the host-owned Document PiP window.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    useDocumentPiPMediaSession();

    const showPiP = useSelector(shouldShowPiP);

    if (!showPiP) {
        return null;
    }

    if (isEmbedded()) {
        // The host owns the Document PiP document. Electron stays on Video PiP and browsers
        // without the Document PiP API fall back to the existing Video PiP element; everywhere
        // else the embedded meeting renders nothing here.
        return browser.isElectron() || !IS_DOCUMENT_PIP_SUPPORTED ? <PiPVideoElement /> : null;
    }

    if (IS_DOCUMENT_PIP_SUPPORTED) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
