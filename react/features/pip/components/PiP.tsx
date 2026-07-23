import React from 'react';
import { useSelector } from 'react-redux';

import { isEmbedded } from '../../base/util/embedUtils';
import {
    isEmbeddedDocumentPiPAvailable,
    isEmbeddedDocumentPiPCapabilityPending
} from '../embeddedDocumentPiP';
import { shouldShowPiP } from '../functions';
import { useDocumentPiPMediaSession } from '../hooks';
import { isDocumentPiPSupported } from '../utils';

import DocumentPiPPortal from './PiPPortal';
import PiPVideoElement from './PiPVideoElement';

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    const showPiP = useSelector(shouldShowPiP);
    const embeddedDocumentPiPAvailable = useSelector(isEmbeddedDocumentPiPAvailable);
    const embeddedDocumentPiPCapabilityPending = useSelector(isEmbeddedDocumentPiPCapabilityPending);

    useDocumentPiPMediaSession();

    if (isEmbedded() && (embeddedDocumentPiPAvailable || embeddedDocumentPiPCapabilityPending)) {
        return null;
    }

    if (!isEmbedded() && isDocumentPiPSupported()) {
        return <DocumentPiPPortal />;
    }

    if (!showPiP) {
        return null;
    }

    return <PiPVideoElement />;
}

export default PiP;
