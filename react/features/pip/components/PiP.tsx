import React from 'react';
import { useSelector } from 'react-redux';

import { isDocumentPiPSupported, shouldShowPiP } from '../functions';

import PiPVideoElement from './PiPVideoElement';
import { DocumentPiPContent } from './web/DocumentPiPContent';

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

    if (isDocumentPiPSupported()) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
