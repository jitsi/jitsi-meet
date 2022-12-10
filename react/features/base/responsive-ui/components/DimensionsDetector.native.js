// @flow

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {

    /**
     * The "onLayout" handler.
     */
    onDimensionsChanged: Function,

    /**
     * The safe are insets handler.
     */
    onSafeAreaInsetsChanged: Function,

    /**
     * Any nested components.
     */
    children: React$Node
};

/**
 * A {@link View} which captures the 'onLayout' event and calls a prop with the
 * component size.
 *
 * @param {Props} props - The read-only properties with which the new
 * instance is to be initialized.
 * @returns {Component} - Renders the root view and it's children.
 */
export default function DimensionsDetector(props: Props) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = useSafeAreaInsets();
    const { children, onDimensionsChanged, onSafeAreaInsetsChanged } = props;

    useEffect(() => {
        onSafeAreaInsetsChanged && onSafeAreaInsetsChanged({
            top,
            right,
            bottom,
            left
        });
    }, [ onSafeAreaInsetsChanged, top, right, bottom, left ]);

    /**
     * Handles the "on layout" View's event and calls the onDimensionsChanged
     * prop.
     *
     * @param {Object} event - The "on layout" event object/structure passed
     * by react-native.
     * @private
     * @returns {void}
     */
    const onLayout = useCallback(({ nativeEvent: { layout: { height, width } } }) => {
        onDimensionsChanged && onDimensionsChanged(width, height);
    }, [ onDimensionsChanged ]);

    return (
        <View
            onLayout = { onLayout }
            style = { StyleSheet.absoluteFillObject } >
            { children }
        </View>
    );
}
