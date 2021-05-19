// @flow

import React from 'react';
import { View } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

import { Icon } from '../../../base/icons';

let buttonContent;

/**
 * The type of the React {@code Component} props of {@link Button}
 */
type Props = {

    /**
     * Button content.
     */
    content?: string,

    /**
     * Is the button icon type?
     */
    iconButton?: boolean,

    /**
     * Style for the icon
     */
    iconStyle?: Object,

    /**
     * Size of the icon.
     */
    iconSize?: number,

    /**
     * Icon component source.
     */
    iconSrc?: Object,

    /**
     * Button mode.
     */
    mode?: string,

    /**
     * Style of button's inner content.
     */
    contentStyle?: Object,

    /**
     * The action to be performed when the button is pressed.
     */
    onPress?: Function,

    /**
     * An external style object passed to the component.
     */
    style?: Object,

    /**
     * Theme to be applied.
     */
    theme?: Object
};

/**
 * Close button component.
 *
 * @returns {React$Element<any>}
 */
function Button({
    iconButton,
    iconStyle,
    iconSize,
    iconSrc,
    content,
    contentStyle,
    mode,
    onPress,
    style,
    theme
}: Props) {

    if (iconButton) {
        buttonContent
            = (<View
                /* eslint-disable-next-line react-native/no-inline-styles */
                style = {{
                    height: 0,
                    width: 0
                }}>
                <Icon
                    size = { iconSize }
                    src = { iconSrc }
                    style = { iconStyle } />
            </View>);

    } else {
        buttonContent = content;
    }

    return (
        <PaperButton
            contentStyle = { contentStyle }
            mode = { mode }
            onPress = { onPress }
            style = { style }
            theme = { theme }>
            { buttonContent }
        </PaperButton>
    );
}

export default Button;
