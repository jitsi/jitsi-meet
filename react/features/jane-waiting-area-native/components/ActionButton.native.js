import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import styles from './styles';

type Props = {
    onPress: Function,
    title: string,
    containerStyle: Object,
    titleStyle: Object
};

export const ActionButton: Props = ({ onPress, title, containerStyle = {}, titleStyle = {} }) => (<TouchableOpacity
    onPress = { onPress }
    style = { [ styles.actionButtonContainer, containerStyle ] }>
    <Text style = { [ styles.actionBtnTitle, titleStyle ] }>
        {
            title
        }
    </Text>
</TouchableOpacity>);
