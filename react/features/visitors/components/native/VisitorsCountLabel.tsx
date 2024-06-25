import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconUsers } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { getVisitorsShortText, iAmVisitor, isVisitorsLive } from '../../functions';

const styles = {
    raisedHandsCountLabel: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.warning02,
        borderRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        marginLeft: BaseTheme.spacing[0],
        marginBottom: BaseTheme.spacing[0]
    },

    raisedHandsCountLabelText: {
        color: BaseTheme.palette.uiBackground,
        paddingLeft: BaseTheme.spacing[2]
    }
};

const VisitorsCountLabel = () => {
    const visitorsMode = useSelector((state: IReduxState) => iAmVisitor(state));
    const visitorsCount = useSelector((state: IReduxState) =>
        state['features/visitors'].count || 0);
    const { t } = useTranslation();
    const isLive = useSelector(isVisitorsLive);
    let visitorsWaiting = '';

    if (isLive === false) {
        visitorsWaiting = t('visitors.waiting');
    }

    return !visitorsMode && visitorsCount > 0 ? (
        <Label
            icon = { IconUsers }
            iconColor = { BaseTheme.palette.uiBackground }
            style = { styles.raisedHandsCountLabel }
            text = { `${getVisitorsShortText(visitorsCount)} ${visitorsWaiting}` }
            textStyle = { styles.raisedHandsCountLabelText } />
    ) : null;
};

export default VisitorsCountLabel;
