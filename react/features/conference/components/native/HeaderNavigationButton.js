// @flow

import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Icon } from '../../../base/icons';

import styles from './styles';

type Props = {

    /**
     * Callback to invoke when the {@code HeaderNavigationButton} is clicked/pressed.
     */
    onPress: Function,

    /**
     * The ImageSource to be rendered as image.
     */
    src: Object,

    /**
     * The component's external style.
     */
    style?: Object
}

const HeaderNavigationButton = ({ onPress, src, style }: Props) => (
    <TouchableOpacity
        onPress = { onPress }
        style = { styles.headerNavigationButton } >
        <Icon
            size = { 20 }
            src = { src }
            style = { [ styles.headerNavigationIcon, style ] } />
    </TouchableOpacity>
);


export default HeaderNavigationButton;
