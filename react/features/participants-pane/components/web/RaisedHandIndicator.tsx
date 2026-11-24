import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconRaiseHand } from '../../../base/icons/svg';

const useStyles = makeStyles()(theme => {
    return {
        indicator: {
            backgroundColor: theme.palette.participantRaisedHandBadge,
            borderRadius: `${Number(theme.shape.borderRadius) / 2}px`,
            height: '24px',
            width: '24px'
        }
    };
});

export const RaisedHandIndicator = () => {
    const { classes: styles, theme } = useStyles();
    const { t } = useTranslation();

    return (
        <div className = { styles.indicator }>
            <Icon
                alt = { t('participantsPane.indicators.raisedHand') }
                color = { theme.palette.participantRaisedHandIcon }
                size = { 16 }
                src = { IconRaiseHand } />
        </div>
    );
};
