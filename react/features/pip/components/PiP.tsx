import React from 'react';
import { useSelector } from 'react-redux';

import { shouldShowPiP } from '../functions';

import PiPVideoElement from './PiPVideoElement';

/**
 * Wrapper component that conditionally renders PiPVideoElement.
 * Prevents mounting when PiP is disabled or on prejoin without showOnPrejoin flag.
 *
 * @returns {React.ReactElement | null}
 */
function PiP() {
    const showPiP = useSelector(shouldShowPiP);

    if (!showPiP) {
        return null;
    }

    return <PiPVideoElement />;
}

export default PiP;
