import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import styles from './styles';

type Props = {
    onPress: Function,
    title: string,
    disabled: boolean,
};

export const ActionButton: Props = ({ onPress, title, disabled }) => {

    const containerStyle = disabled ? styles.disabledButtonContainer : styles.joinButtonContainer;
    const titleStyle = disabled ? styles.disabledButtonText : styles.joinButtonText;

    return (<TouchableOpacity
        disabled = { disabled }
        onPress = { onPress }
        style = { [ styles.actionButtonContainer, containerStyle ] }>
        <Text style = { [ styles.actionBtnTitle, titleStyle ] }>
            {
                title
            }
        </Text>
    </TouchableOpacity>);
};
