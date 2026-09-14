import React from 'react';
import { useSelector } from 'react-redux';

import { browser } from '../../base/lib-jitsi-meet';
import { isEmbedded } from '../../base/util/embedUtils';
import { isElectronPiPWindowMode, shouldShowPiP, shouldUseDocumentPiP } from '../functions';
import { useDocumentPiPMediaSession } from '../hooks';

import PiPVideoElement from './PiPVideoElement';
import { DocumentPiPContent } from './web/DocumentPiPContent';
import ElectronPiPWindow from './web/ElectronPiPWindow';

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
    const electronWindowMode = useSelector(isElectronPiPWindowMode);
    const documentPiP = useSelector(shouldUseDocumentPiP);

    if (!showPiP) {
        return null;
    }

    if (browser.isElectron()) {
        // Electron (embedded or not): the custom PiP window is the default and
        // falls back to the video-element PiP when disabled through
        // config.pip.mode or when the embedding app cannot create the window.
        return electronWindowMode ? <ElectronPiPWindow /> : <PiPVideoElement />;
    }

    if (isEmbedded()) {
        // The host owns the Document PiP document. Browsers without the
        // Document PiP API (or configured for the video-element PiP) use the
        // existing Video PiP element; everywhere else the embedded meeting
        // renders nothing here.
        return documentPiP ? null : <PiPVideoElement />;
    }

    if (documentPiP) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
