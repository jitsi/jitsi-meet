import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconUsers } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { getVisitorsShortText, iAmVisitor, isVisitorsLive } from '../../functions';

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
    const visitorsMode = useSelector((state: IReduxState) => iAmVisitor(state));
    const visitorsCount = useSelector((state: IReduxState) =>
        state['features/visitors'].count || 0);
    const { t } = useTranslation();
    const isLive = useSelector(isVisitorsLive);
    let visitorsWaiting = '';
    let labelTooltip = t('visitors.labelTooltip', { count: visitorsCount });

    if (isLive === false) {
        visitorsWaiting = t('visitors.waiting');
        labelTooltip = `${labelTooltip} ${visitorsWaiting}`;
        visitorsWaiting = '*';
    }

    return !visitorsMode && visitorsCount > 0 ? (<Tooltip
        content = { labelTooltip }
        position = { 'bottom' }>
        <Label
            className = { styles.label }
            icon = { IconUsers }
            iconColor = { theme.palette.icon04 }
            id = 'visitorsCountLabel'
            text = { `${getVisitorsShortText(visitorsCount)} ${visitorsWaiting}` } />
    </Tooltip>) : null;
};

export default VisitorsCountLabel;
