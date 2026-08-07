import React from 'react';
import { useSelector } from 'react-redux';

import { isDocumentPiPSupported } from '../external-api.shared';
import { shouldShowPiP } from '../functions';

import DocumentPiP from './DocumentPiP';
import PiPVideoElement from './PiPVideoElement';

/**
 * Wrapper component that conditionally renders the PiP renderer.
 * Uses the rich Document PiP window when supported, otherwise the classic
 * single-video PiP element. Prevents mounting when PiP is disabled.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    const showPiP = useSelector(shouldShowPiP);

    if (!showPiP) {
        return null;
    }

    return isDocumentPiPSupported() ? <DocumentPiP /> : <PiPVideoElement />;
}

export default PiP;
