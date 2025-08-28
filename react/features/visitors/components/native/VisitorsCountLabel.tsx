import React from 'react';
import { useSelector } from 'react-redux';

import { IconUsers } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { getVisitorsCount, getVisitorsShortText } from '../../functions';

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
    const visitorsCount = useSelector(getVisitorsCount);

    return visitorsCount > 0 ? (
        <Label
            icon = { IconUsers }
            iconColor = { BaseTheme.palette.uiBackground }
            style = { styles.raisedHandsCountLabel }
            text = { `${getVisitorsShortText(visitorsCount)}` }
            textStyle = { styles.raisedHandsCountLabelText } />
    ) : null;
};

export default VisitorsCountLabel;
