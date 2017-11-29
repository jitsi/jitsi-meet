// @flow

import React from 'react';
import {
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import AbstractContainer from '../AbstractContainer';

/**
 * Represents a container of React Native/mobile {@link Component} children.
 *
 * @extends AbstractContainer
 */
export default class Container extends AbstractContainer {
    /**
     * {@code Container} component's property types.
     *
     * @static
     */
    static propTypes = AbstractContainer.propTypes;

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
            visible = true,
            ...props
        } = this.props;

        // visible
        if (!visible) {
            return null;
        }

        let element = super._render(View, props);

        // onClick & touchFeedback
        if (element && (onClick || touchFeedback)) {
            element
                = React.createElement(
                    touchFeedback
                        ? TouchableHighlight
                        : TouchableWithoutFeedback,
                    {
                        accessibilityLabel,
                        accessible,
                        onPress: onClick
                    },
                    element);
        }

        return element;
    }
}
