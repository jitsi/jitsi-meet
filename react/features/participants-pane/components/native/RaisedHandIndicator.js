import React from 'react';
import { View } from 'react-native';

import { Icon, IconRaisedHandHollow } from '../../../base/icons';

import styles from './styles';

export const RaisedHandIndicator = () => (
    <View style = { styles.raisedHandIndicator }>
        <Icon
            size = { 15 }
            src = { IconRaisedHandHollow }
            style = { styles.raisedHandIcon } />
    </View>
);
