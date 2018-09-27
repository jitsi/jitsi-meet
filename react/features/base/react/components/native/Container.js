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
     * Passthrough callback for the native long press event. For details, see
     * {@code AbstractProps#onClick}.
     */
    onLongClick?: ?Function
};

/**
 * Represents a container of React Native/mobile {@link Component} children.
 *
 * @extends AbstractContainer
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
            onLongClick,
            touchFeedback = onClick,
            underlayColor,
            visible = true,
            ...props
        } = this.props;

        // visible
        if (!visible) {
            return null;
        }

        const onClickOrTouchFeedback = onClick || onLongClick || touchFeedback;
        let element
            = super._render(
                View,
                {
                    pointerEvents: onClickOrTouchFeedback ? 'auto' : 'box-none',
                    ...props
                });

        // onClick & touchFeedback
        if (element && onClickOrTouchFeedback) {
            element
                = React.createElement(
                    touchFeedback
                        ? TouchableHighlight
                        : TouchableWithoutFeedback,
                    {
                        accessibilityLabel,
                        accessible,
                        onPress: onClick,
                        onLongPress: onLongClick,
                        underlayColor
                    },
                    element);
        }

        return element;
    }
}
