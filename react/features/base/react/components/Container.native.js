import React from 'react';
import {
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import AbstractContainer from './AbstractContainer';

/**
 * Represents a container of React Native Component children with a style.
 *
 * @extends AbstractContainer
 */
export class Container extends AbstractContainer {
    /**
     * Container component's property types.
     *
     * @static
     */
    static propTypes = AbstractContainer.propTypes

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // eslint-disable-next-line prefer-const
        let { onClick, style, touchFeedback, visible, ...props } = this.props;

        // visible
        if (typeof visible !== 'undefined' && !visible) {
            return null;
        }

        // onClick & touchFeedback
        (typeof touchFeedback === 'undefined') && (touchFeedback = onClick);

        const renderParent = touchFeedback || onClick;

        // eslint-disable-next-line object-property-newline
        let component = this._render(View, { ...props, style });

        if (renderParent) {
            const parentType
                = touchFeedback ? TouchableHighlight : TouchableWithoutFeedback;
            const parentProps = {};

            onClick && (parentProps.onPress = onClick);

            component = React.createElement(parentType, parentProps, component);
        }

        return component;
    }
}
