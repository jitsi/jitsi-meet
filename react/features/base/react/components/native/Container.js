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
        // eslint-disable-next-line prefer-const
        let { onClick, style, touchFeedback, visible, ...props } = this.props;

        // onClick & touchFeedback
        (typeof touchFeedback === 'undefined') && (touchFeedback = onClick);

        // visible

        // The following property is responsible to hide/show this Container by
        // setting its size to 0. This will make the component not visible, but
        // it won't be destroyed, all its state is preserved. This is
        // intentional.
        // TODO: replace with display: 'none', supported in RN >= 0.43.
        const hidden = visible === false;  // true / undefined

        if (hidden) {
            style = {
                ...style,
                height: 0,
                width: 0
            };
        }

        // eslint-disable-next-line object-property-newline
        let component = super._render(View, { ...props, style });

        if (!hidden && (touchFeedback || onClick)) {
            const parentType
                = touchFeedback ? TouchableHighlight : TouchableWithoutFeedback;
            const parentProps = {};

            onClick && (parentProps.onPress = onClick);

            component = React.createElement(parentType, parentProps, component);
        }

        return component;
    }
}
