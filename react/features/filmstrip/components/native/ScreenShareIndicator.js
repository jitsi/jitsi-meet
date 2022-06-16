// @flow

import React from 'react';

import { IconShareDesktop } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge for displaying if a participant is sharing their screen.
 *
 * @returns {React$Element<any>}
 */
export default function ScreenShareIndicator() {
    return (
        <BaseIndicator icon = { IconShareDesktop } />
    );
}
