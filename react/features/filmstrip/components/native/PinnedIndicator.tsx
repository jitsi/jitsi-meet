import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconPin } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

/**
 * Thumbnail badge for displaying if a participant is pinned.
 *
 * @returns {React$Element<any>}
 */
export default function PinnedIndicator() {
    const { t } = useTranslation();
    const label = t('pinnedParticipant');

    return (
        <BaseIndicator
            accessibilityLabel = { label }
            icon = { IconPin } />
    );
}
