import React from 'react';
import { useSelector } from 'react-redux';

import { isDocumentPiPSupported, shouldShowPiP } from '../functions';

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
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    const showPiP = useSelector(shouldShowPiP);

     if (!showPiP) {
        return null;
    }

    if (IS_DOCUMENT_PIP_SUPPORTED) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
