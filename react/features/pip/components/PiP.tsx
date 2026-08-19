import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { isEmbedded } from '../../base/util/embedUtils';
import { retryHostDocumentPiPShow } from '../actions';
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
        if (embedded && hostDocumentPiPAvailable !== undefined) {
            dispatch(retryHostDocumentPiPShow());
        }
    }, [ dispatch, embedded, hostDocumentPiPAvailable ]);

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
