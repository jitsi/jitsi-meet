/* @flow */

import React from 'react';
import {
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { Platform } from '../../';
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
            onClick,
            touchFeedback = onClick,
            visible = true,
            ...props
        } = this.props;

        // visible
        if (!visible) {
            // FIXME: It turns out that display: none will fail on some Android
            // devices, but work on the others (currently fails on Google Pixel)
            if (Platform.OS === 'android') {
                return null;
            }

            // Intentionally hide this Container without destroying it.
            props.style = {
                ...props.style,
                display: 'none'
            };
        }

        let element = super._render(View, props);

        // onClick & touchFeedback
        if (visible && (onClick || touchFeedback)) {
            element = React.createElement(
                touchFeedback ? TouchableHighlight : TouchableWithoutFeedback,
                { onPress: onClick },
                element
            );
        }

        return element;
    }
}
