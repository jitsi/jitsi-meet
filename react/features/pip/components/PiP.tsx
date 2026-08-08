import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { isEmbedded } from '../../base/util/embedUtils';
import { isDocumentPiPSupported, shouldShowPiP } from '../functions';
import { useDocumentPiPMediaSession } from '../hooks';

import PiPVideoElement from './PiPVideoElement';
import { DocumentPiPContent } from './web/DocumentPiPContent';

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    useDocumentPiPMediaSession();

    const showPiP = useSelector(shouldShowPiP);
    const embeddedDocumentPiPAvailable = useSelector(
        (state: IReduxState) => state['features/pip']?.embeddedDocumentPiPAvailable);

    if (isEmbedded()) {
        // The host owns the Document PiP document. The iframe only renders the existing
        // Video PiP element after capability negotiation has selected the legacy fallback.
        return showPiP && embeddedDocumentPiPAvailable === false ? <PiPVideoElement /> : null;
    }

    if (!showPiP) {
        return null;
    }

    if (isDocumentPiPSupported()) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
