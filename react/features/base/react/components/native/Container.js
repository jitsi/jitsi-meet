/* @flow */

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
            onClick,
            touchFeedback = onClick,
            visible = true,
            ...props
        } = this.props;

        // visible
        if (!visible) {
            // Intentionally hide this Container without destroying it.
            // TODO Replace with display: 'none' supported in RN >= 0.43.
            props.style = {
                ...props.style,
                height: 0,
                width: 0
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
