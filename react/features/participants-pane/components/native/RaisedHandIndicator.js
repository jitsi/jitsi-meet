import React from 'react';
import { View } from 'react-native';

import { Icon, IconRaiseHand } from '../../../base/icons';

import styles from './styles';

export const RaisedHandIndicator = () => (
    <View style = { styles.raisedHandIndicator }>
        <Icon
            size = { 16 }
            src = { IconRaiseHand }
            style = { styles.raisedHandIcon } />
    </View>
);
