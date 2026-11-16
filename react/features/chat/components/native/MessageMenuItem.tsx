import React from 'react';
import { Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

import Icon from '../../../base/icons/components/Icon';

import styles from './styles';

interface IProps {
    icon: Function;
    label: string;
    onPress: () => void;
}

/**
 * A single row of the chat message menu.
 *
 * @returns {JSX.Element}
 */
const MessageMenuItem = ({ icon, label, onPress }: IProps) => (
    <TouchableOpacity
        accessibilityLabel = { label }
        accessibilityRole = 'button'
        onPress = { onPress }
        style = { styles.messageMenuItem as ViewStyle }>
        <Icon
            size = { 24 }
            src = { icon } />
        <Text style = { styles.messageMenuItemText as TextStyle }>{ label }</Text>
    </TouchableOpacity>
);

export default MessageMenuItem;
