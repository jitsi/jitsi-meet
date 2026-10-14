import React from 'react';
import { useSelector } from 'react-redux';

import { browser } from '../../base/lib-jitsi-meet';
import { isEmbedded } from '../../base/util/embedUtils';
import { isElectronPiPWindowMode, shouldShowPiP, shouldUseDocumentPiP } from '../functions';
import { useDocumentPiPMediaSession, useElectronPiPWindow } from '../hooks';

import PiPVideoElement from './PiPVideoElement';
import { ElectronPiPView } from './web/ElectronPiPView';
import { PiPWindowPortal } from './web/PiPWindowPortal';

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 * Embedded meetings defer to the host-owned Document PiP window.
 * Electron gets the custom always-on-top PiP window, which reuses the
 * Document PiP window portal and view.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    useDocumentPiPMediaSession();
    useElectronPiPWindow();

    const showPiP = useSelector(shouldShowPiP);
    const electronWindowMode = useSelector(isElectronPiPWindowMode);
    const documentPiP = useSelector(shouldUseDocumentPiP);

    if (!showPiP) {
        return null;
    }

    if (browser.isElectron()) {
        // Electron (embedded or not): the custom PiP window is the default,
        // the video-element PiP is used when config.pip.mode asks for it.
        // useElectronPiPWindow opens and closes the window; the portal renders
        // the shared view wrapped with the window's gestures into it.
        return electronWindowMode
            ? <PiPWindowPortal><ElectronPiPView /></PiPWindowPortal>
            : <PiPVideoElement />;
    }

    if (isEmbedded()) {
        // The host owns the Document PiP document. Browsers without the
        // Document PiP API (or configured for the video-element PiP) use the
        // existing Video PiP element; everywhere else the embedded meeting
        // renders nothing here.
        return documentPiP ? null : <PiPVideoElement />;
    }

    if (documentPiP) {
        return <PiPWindowPortal />;
    }

    return <PiPVideoElement />;
}

export default PiP;
