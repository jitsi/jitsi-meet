// @flow

import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { Icon } from '../../../base/font-icons';

import AbstractToolboxItem from './AbstractToolboxItem';
import type { Props } from './AbstractToolboxItem';

/**
 * Native implementation of {@code AbstractToolboxItem}.
 */
export default class ToolboxItem extends AbstractToolboxItem<Props> {
    /**
     * Transform the given (web) icon name into a name that works with
     * {@code Icon}.
     *
     * @private
     * @returns {string}
     */
    _getIconName() {
        const { iconName } = this.props;

        return iconName.replace('icon-', '').split(' ')[0];
    }

    /**
     * Helper function to render the {@code Icon} part of this item.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderIcon() {
        const { styles } = this.props;

        return (
            <Icon
                name = { this._getIconName() }
                style = { styles && styles.iconStyle } />
        );
    }

    /**
     * Handles rendering of the actual item.
     *
     * @protected
     * @returns {ReactElement}
     */
    _renderItem() {
        const {
            accessibilityLabel,
            disabled,
            onClick,
            showLabel,
            styles
        } = this.props;

        let children;

        if (showLabel) {
            // eslint-disable-next-line no-extra-parens
            children = (
                <View style = { styles && styles.style } >
                    { this._renderIcon() }
                    <Text style = { styles && styles.labelStyle } >
                        { this.label }
                    </Text>
                </View>
            );
        } else {
            children = this._renderIcon();
        }

        // When using a wrapper view, apply the style to it instead of
        // applying it to the TouchableHighlight.
        const style = showLabel ? undefined : styles && styles.style;

        return (
            <TouchableHighlight
                accessibilityLabel = { accessibilityLabel }
                disabled = { disabled }
                onPress = { onClick }
                style = { style }
                underlayColor = { styles && styles.underlayColor } >
                { children }
            </TouchableHighlight>
        );
    }
}
