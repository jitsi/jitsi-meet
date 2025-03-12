import React from 'react';
import {
    GestureResponderEvent,
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import AbstractContainer, { IProps as AbstractProps } from '../AbstractContainer';

interface IProps extends AbstractProps {

    onClick?: (e: GestureResponderEvent) => void;

    /**
     * The event handler/listener to be invoked when this
     * {@code AbstractContainer} is long pressed on React Native.
     */
    onLongPress?: (e: GestureResponderEvent) => void;

    pointerEvents?: string;
}

/**
 * Represents a container of React Native/mobile {@link Component} children.
 *
 * @augments AbstractContainer
 */
export default class Container extends AbstractContainer<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            accessibilityLabel,
            accessible,
            onClick,
            onLongPress,
            touchFeedback = Boolean(onClick || onLongPress),
            underlayColor,
            visible = true,
            ...props
        } = this.props;

        // visible
        if (!visible) {
            return null;
        }

        const onClickOrTouchFeedback = onClick || onLongPress || touchFeedback;
        let element
            = super._render(
                View,
                {
                    pointerEvents: onClickOrTouchFeedback ? 'auto' : 'box-none',
                    ...props
                });

        // onClick & touchFeedback
        if (element && onClickOrTouchFeedback) {
            const touchableProps = {
                accessibilityLabel,
                accessible,
                onLongPress,
                onPress: onClick
            };

            element
                = touchFeedback
                    ? React.createElement(
                        TouchableHighlight,
                        {
                            ...touchableProps,
                            underlayColor
                        },
                        element)
                    : React.createElement(
                        TouchableWithoutFeedback, touchableProps, element);
        }

        return element;
    }
}
