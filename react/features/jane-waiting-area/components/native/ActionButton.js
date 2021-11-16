// @flow
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import styles from './styles';

type Props = {
    onPress: Function,
    title: string,
    disabled?: boolean,
};

export const ActionButton = (props: Props): React$Node => {

    const containerStyle = props.disabled ? styles.disabledButtonContainer : styles.joinButtonContainer;
    const titleStyle = props.disabled ? styles.disabledButtonText : styles.joinButtonText;

    return (<TouchableOpacity
        disabled = { props.disabled }
        onPress = { props.onPress }
        style = { [ styles.actionButtonContainer, containerStyle ] }>
        <Text style = { [ styles.actionBtnTitle, titleStyle ] }>
            {
                props.title
            }
        </Text>
    </TouchableOpacity>);
};
