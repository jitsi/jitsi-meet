import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconTranslate, IconTranslateWave } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { isAudioTranslationActiveInMeeting, isTranslationPlayingOut } from '../../functions';

const useStyles = makeStyles()(theme => {
    return {
        playingOut: {
            background: theme.palette.warning03
        },
        translation: {
            background: theme.palette.action01
        }
    };
});

/**
 * Conference-header label shown while audio translation is active in the meeting. Turns amber while a
 * speaker's translated audio is still playing out, so everyone knows to wait before speaking.
 *
 * @returns {ReactElement|null}
 */
const TranslationLabel = () => {
    const { classes: styles } = useStyles();
    const { t } = useTranslation();
    const active = useSelector(isAudioTranslationActiveInMeeting);
    const playingOut = useSelector(isTranslationPlayingOut);

    // playingOut can outlast the control-plane signals, and it is the one state worth waiting on.
    if (!active && !playingOut) {
        return null;
    }

    const content = t(playingOut ? 'audioTranslation.labelTooltipPlaying' : 'audioTranslation.labelTooltip');

    return (
        <Tooltip
            content = { content }
            position = { 'bottom' }>
            <Label
                accessibilityText = { content }
                className = { playingOut ? styles.playingOut : styles.translation }
                icon = { playingOut ? IconTranslateWave : IconTranslate } />
        </Tooltip>
    );
};

export default TranslationLabel;
