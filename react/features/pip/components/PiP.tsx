import React from 'react';
import { useSelector } from 'react-redux';

import { shouldShowPiP } from '../functions';

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

    // Document PiP must mount regardless of shouldShowPiP
    // because useDocumentPiPMediaSession registers the enterpictureinpicture
    // MediaSession handler needed for tab-switch auto-open.
    if ('documentPictureInPicture' in window) {
        return (<>
            <PiPVideoElement />
            <DocumentPiPPortal />
        </>);
    }

    if (!showPiP) {
        return null;
    }

    return <PiPVideoElement />;
}

export default PiP;
