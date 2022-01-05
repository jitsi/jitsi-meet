// @flow

import React from 'react';
import {
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import AbstractContainer from '../AbstractContainer';
import type { Props as AbstractProps } from '../AbstractContainer';

type Props = AbstractProps & {

    /**
     * The event handler/listener to be invoked when this
     * {@code AbstractContainer} is long pressed on React Native.
     */
    onLongPress?: ?Function,
};

/**
 * Represents a container of React Native/mobile {@link Component} children.
 *
 * @augments AbstractContainer
 */
export default class Container<P: Props> extends AbstractContainer<P> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
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
