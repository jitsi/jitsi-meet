// @flow

import React from 'react';

import { IconPinParticipant } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge for displaying if a participant is pinned.
 *
 * @returns {React$Element<any>}
 */
export default function PinnedIndicator() {
    return (
        <BaseIndicator icon = { IconPinParticipant } />
    );
}
