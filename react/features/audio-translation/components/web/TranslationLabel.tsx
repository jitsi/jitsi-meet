import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconTranslate } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { isAudioTranslationActiveInMeeting } from '../../functions';

const useStyles = makeStyles()(theme => {
    return {
        translation: {
            background: theme.palette.action01
        }
    };
});

/**
 * Conference-header label shown while audio translation is active in the meeting.
 *
 * @returns {ReactElement|null}
 */
const TranslationLabel = () => {
    const { classes: styles } = useStyles();
    const { t } = useTranslation();
    const active = useSelector(isAudioTranslationActiveInMeeting);

    if (!active) {
        return null;
    }

    const content = t('audioTranslation.labelTooltip');

    return (
        <Tooltip
            content = { content }
            position = { 'bottom' }>
            <Label
                accessibilityText = { content }
                className = { styles.translation }
                icon = { IconTranslate } />
        </Tooltip>
    );
};

export default TranslationLabel;
