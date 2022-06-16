// @flow

import React from 'react';
import { useSelector } from 'react-redux';

import { IconRaisedHand } from '../../../base/icons';
import { Label } from '../../../base/label';
import BaseTheme from '../../../base/ui/components/BaseTheme';

import styles from './styles';

const RaisedHandsCountLabel = () => {
    const raisedHandsCount = useSelector(state =>
        (state['features/base/participants'].raisedHandsQueue || []).length);

    return raisedHandsCount > 0 && (
        <Label
            icon = { IconRaisedHand }
            iconColor = { BaseTheme.palette.uiBackground }
            style = { styles.raisedHandsCountLabel }
            text = { raisedHandsCount }
            textStyle = { styles.raisedHandsCountLabelText } />
    );
};

export default RaisedHandsCountLabel;
