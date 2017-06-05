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
        let { onClick, style, touchFeedback, ...props } = this.props;

        // eslint-disable-next-line object-property-newline
        let component = this._render(View, { ...props, style });

        if (component) {
            // onClick & touchFeedback
            (typeof touchFeedback === 'undefined') && (touchFeedback = onClick);
            if (touchFeedback || onClick) {
                const parentType
                    = touchFeedback
                        ? TouchableHighlight
                        : TouchableWithoutFeedback;
                const parentProps = {};

                onClick && (parentProps.onPress = onClick);

                component
                    = React.createElement(parentType, parentProps, component);
            }
        }

        return component;
    }
}
