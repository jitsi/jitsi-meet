import React from 'react';
import { useSelector } from 'react-redux';

import { IconTranslate } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { isAudioTranslationActiveInMeeting } from '../../functions';

const styles = {
    translationLabel: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        marginBottom: BaseTheme.spacing[0],
        marginLeft: BaseTheme.spacing[0]
    }
};

/**
 * Conference-header label shown while audio translation is active in the meeting.
 *
 * @returns {ReactElement|null}
 */
const TranslationLabel = () => {
    const active = useSelector(isAudioTranslationActiveInMeeting);

    return active ? (
        <Label
            icon = { IconTranslate }
            iconColor = { BaseTheme.palette.icon01 }
            style = { styles.translationLabel } />
    ) : null;
};

export default TranslationLabel;
