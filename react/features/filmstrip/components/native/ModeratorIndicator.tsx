import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconModerator } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

/**
 * Thumbnail badge showing that the participant is a conference moderator.
 *
 * @returns {JSX.Element}
 */
const ModeratorIndicator = (): JSX.Element => {
    const { t } = useTranslation();
    const label = t('videothumbnail.moderator');

    return (
        <BaseIndicator
            accessibilityLabel = { label }
            icon = { IconModerator } />
    );
};

export default ModeratorIndicator;
