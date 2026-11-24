import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconScreenshare } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

/**
 * Thumbnail badge for displaying if a participant is sharing their screen.
 *
 * @returns {React$Element<any>}
 */
export default function ScreenShareIndicator() {
    const { t } = useTranslation();
    const label = t('videothumbnail.screenSharing');

    return (
        <BaseIndicator
            accessibilityLabel = { label }
            icon = { IconScreenshare } />
    );
}
