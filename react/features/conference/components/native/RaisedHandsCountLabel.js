import React from 'react';
import { useSelector } from 'react-redux';

import { IconRaiseHand } from '../../../base/icons';
import { Label } from '../../../base/label';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import styles from './styles';

const RaisedHandsCountLabel = () => {
    const raisedHandsCount = useSelector(state =>
        (state['features/base/participants'].raisedHandsQueue || []).length);

    return raisedHandsCount > 0 && (
        <Label
            icon = { IconRaiseHand }
            iconColor = { BaseTheme.palette.uiBackground }
            style = { styles.raisedHandsCountLabel }
            text = { raisedHandsCount }
            textStyle = { styles.raisedHandsCountLabelText } />
    );
};

export default RaisedHandsCountLabel;
