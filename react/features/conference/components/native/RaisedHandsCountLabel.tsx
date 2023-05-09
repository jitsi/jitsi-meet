import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconRaiseHand } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import styles from './styles';

const RaisedHandsCountLabel = () => {
    const raisedHandsCount = useSelector((state: IReduxState) =>
        (state['features/base/participants'].raisedHandsQueue || []).length);

    return raisedHandsCount > 0 ? (
        <Label
            icon = { IconRaiseHand }
            iconColor = { BaseTheme.palette.uiBackground }
            style = { styles.raisedHandsCountLabel }
            text = { `${raisedHandsCount}` }
            textStyle = { styles.raisedHandsCountLabelText } />
    ) : null;
};

export default RaisedHandsCountLabel;
