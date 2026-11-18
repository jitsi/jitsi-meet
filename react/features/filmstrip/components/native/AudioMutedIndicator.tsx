import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconMicSlash } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

/**
 * Thumbnail badge for displaying the audio mute status of a participant.
 *
 * @returns {JSX.Element}
 */
const AudioMutedIndicator = (): JSX.Element => {
    const { t } = useTranslation();
    const label = t('videothumbnail.mute');

    return (
        <BaseIndicator
            accessibilityLabel = { label }
            icon = { IconMicSlash } />
    );
};

export default AudioMutedIndicator;
