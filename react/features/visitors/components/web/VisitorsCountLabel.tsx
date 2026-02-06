import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconUsers } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { getVisitorsCount, getVisitorsShortText } from '../../functions';

const useStyles = makeStyles()(theme => {
    return {
        label: {
            backgroundColor: theme.palette.visitorsCountBadge,
            color: theme.palette.visitorsCountText
        }
    };
});

const VisitorsCountLabel = () => {
    const { classes: styles, theme } = useStyles();
    const visitorsCount = useSelector(getVisitorsCount);
    const { t } = useTranslation();

    return visitorsCount > 0 ? (<Tooltip
        content = { t('visitors.labelTooltip', { count: visitorsCount }) }
        position = { 'bottom' }>
        <Label
            className = { styles.label }
            icon = { IconUsers }
            iconColor = { theme.palette.visitorsCountIcon }
            id = 'visitorsCountLabel'
            text = { `${getVisitorsShortText(visitorsCount)}` } />
    </Tooltip>) : null;
};

export default VisitorsCountLabel;
