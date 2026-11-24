import React from 'react';
import { useSelector } from 'react-redux';

import { IconTranslate, IconTranslateWave } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import {
    isAudioTranslationActiveInMeeting,
    isAudioTranslationAvailable,
    isTranslationPlayingOut
} from '../../functions';

const styles = {
    playingOutLabel: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.warning03,
        borderRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        marginBottom: BaseTheme.spacing[0],
        marginLeft: BaseTheme.spacing[0]
    },
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
 * Conference-header label shown while audio translation is active in the meeting. Turns amber while a
 * speaker's translated audio is still playing out, so everyone knows to wait before speaking.
 *
 * @returns {ReactElement|null}
 */
const TranslationLabel = () => {
    const available = useSelector(isAudioTranslationAvailable);
    const active = useSelector(isAudioTranslationActiveInMeeting);
    const playingOut = useSelector(isTranslationPlayingOut);

    return available && (active || playingOut) ? (
        <Label
            icon = { playingOut ? IconTranslateWave : IconTranslate }
            iconColor = { BaseTheme.palette.icon01 }
            style = { playingOut ? styles.playingOutLabel : styles.translationLabel } />
    ) : null;
};

export default TranslationLabel;
