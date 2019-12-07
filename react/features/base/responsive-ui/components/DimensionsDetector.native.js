// @flow

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import styles from './styles';

/**
 * AspectRatioDetector component's property types.
 */
type Props = {

    /**
     * The "onLayout" handler.
     */
    onDimensionsChanged: Function,

    /**
     * Any nested components.
     */
    children: React$Node
};

/**
 * A {@link View} which captures the 'onLayout' event and calls a prop with the
 * component size.
 */
export default class DimensionsDetector extends PureComponent<Props> {
    /**
     * Initializes a new DimensionsDetector instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this._onLayout = this._onLayout.bind(this);
    }

    _onLayout: (Object) => void;

    /**
     * Handles the "on layout" View's event and calls the onDimensionsChanged
     * prop.
     *
     * @param {Object} event - The "on layout" event object/structure passed
     * by react-native.
     * @private
     * @returns {void}
     */
    _onLayout({ nativeEvent: { layout: { height, width } } }) {
        const { onDimensionsChanged } = this.props;

        onDimensionsChanged && onDimensionsChanged(width, height);
    }

    /**
     * Renders the root view and it's children.
     *
     * @returns {Component}
     */
    render() {
        return (
            <View
                onLayout = { this._onLayout }
                style = { styles.dimensionsDetector } >
                { this.props.children }
            </View>
        );
    }
}
