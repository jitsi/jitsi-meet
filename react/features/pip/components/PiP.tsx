import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { isEmbedded } from '../../base/util/embedUtils';
import { retryHostDocumentPiPShow, setHostDocumentPiPAvailable } from '../actions';
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
 * The timeout in ms before an unanswered host capability handshake is treated as unavailable.
 */
const HOST_DOCUMENT_PIP_CAPABILITY_TIMEOUT = 10000;

/**
 * Wrapper component that selects the appropriate PiP implementation.
 * Uses Document PiP API when available, falls back to Video PiP.
 * Embedded meetings defer to the host-owned Document PiP window.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    useDocumentPiPMediaSession();

    const dispatch: IStore['dispatch'] = useDispatch();
    const embedded = isEmbedded();
    const showPiP = useSelector(shouldShowPiP);
    const hostDocumentPiPAvailable = useSelector(
        (state: IReduxState) => state['features/pip']?.hostDocumentPiPAvailable);

    useEffect(() => {
        if (!embedded) {
            return;
        }

        if (hostDocumentPiPAvailable !== undefined) {
            dispatch(retryHostDocumentPiPShow());

            return;
        }

        if (!showPiP) {
            return;
        }

        const timeout = window.setTimeout(() => {
            dispatch(setHostDocumentPiPAvailable(false));
        }, HOST_DOCUMENT_PIP_CAPABILITY_TIMEOUT);

        return () => window.clearTimeout(timeout);
    }, [ dispatch, embedded, hostDocumentPiPAvailable, showPiP ]);

    if (embedded) {
        // The host owns the Document PiP document. The iframe only renders the existing
        // Video PiP element when PiP remains enabled and capability negotiation selects the fallback.
        return showPiP && hostDocumentPiPAvailable === false ? <PiPVideoElement /> : null;
    }

    if (!showPiP) {
        return null;
    }

    if (IS_DOCUMENT_PIP_SUPPORTED) {
        return <DocumentPiPContent />;
    }

    return <PiPVideoElement />;
}

export default PiP;
