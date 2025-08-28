import React from 'react';

import { IconPin } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

/**
 * Thumbnail badge for displaying if a participant is pinned.
 *
 * @returns {React$Element<any>}
 */
export default function PinnedIndicator() {
    return (
        <BaseIndicator icon = { IconPin } />
    );
}
