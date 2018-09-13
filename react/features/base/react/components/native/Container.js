// @flow

import React from 'react';
import {
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import AbstractContainer from '../AbstractContainer';
import type { Props } from '../AbstractContainer';

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
            touchFeedback = onClick,
            underlayColor,
            visible = true,
            ...props
        } = this.props;

        // visible
        if (!visible) {
            return null;
        }

        const onClickOrTouchFeedback = onClick || touchFeedback;
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
                        underlayColor
                    },
                    element);
        }

        return element;
    }
}
