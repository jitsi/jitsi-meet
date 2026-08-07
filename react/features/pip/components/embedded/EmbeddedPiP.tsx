import React from 'react';
import { useSelector } from 'react-redux';

import {
    isEmbeddedDocumentPiPAvailable,
    isEmbeddedDocumentPiPCapabilityPending
} from '../../embeddedDocumentPiP';
import { useDocumentPiPMediaSession } from '../../hooks';
import PiPVideoElement from '../PiPVideoElement';

interface IProps {
    showPiP: boolean;
}

/**
 * Owns embedded Document PiP lifecycle hooks without changing standalone PiP.
 *
 * @returns {React.ReactElement | null}
 */
function EmbeddedPiP({ showPiP }: IProps) {
    const embeddedDocumentPiPAvailable = useSelector(isEmbeddedDocumentPiPAvailable);
    const embeddedDocumentPiPCapabilityPending = useSelector(isEmbeddedDocumentPiPCapabilityPending);

    useDocumentPiPMediaSession();

    if (!showPiP || embeddedDocumentPiPAvailable || embeddedDocumentPiPCapabilityPending) {
        return null;
    }

    return <PiPVideoElement />;
}

export default EmbeddedPiP;
