import React from 'react';

import { IconScreenshare } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

/**
 * Thumbnail badge for displaying if a participant is sharing their screen.
 *
 * @returns {React$Element<any>}
 */
export default function ScreenShareIndicator() {
    return (
        <BaseIndicator icon = { IconScreenshare } />
    );
}
