import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconUsers } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';

const useStyles = makeStyles()(theme => {
    return {
        label: {
            backgroundColor: theme.palette.warning02,
            color: theme.palette.uiBackground
        }
    };
});

const VisitorsCountLabel = () => {
    const { classes: styles, theme } = useStyles();
    const visitorsMode = useSelector((state: IReduxState) => state['features/visitors'].enabled);
    const visitorsCount = useSelector((state: IReduxState) =>
        state['features/visitors'].count || 0);
    const { t } = useTranslation();

    let visitorsCountLabel = String(visitorsCount);

    // over 100 we show numbers lik 0.2 K or 9.5 K.
    if (visitorsCount > 100) {
        visitorsCountLabel = `${Math.round(visitorsCount / 100) / 10} K`;
    }

    return visitorsMode && (<Tooltip
        content = { t('visitorsLabel', { count: visitorsCount }) }
        position = { 'bottom' }>
        <Label
            className = { styles.label }
            icon = { IconUsers }
            iconColor = { theme.palette.icon04 }
            id = 'visitorsCountLabel'
            text = { `${visitorsCountLabel}` } />
    </Tooltip>);
};

export default VisitorsCountLabel;
