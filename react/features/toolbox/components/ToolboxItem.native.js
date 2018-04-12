// @flow

import React from 'react';
import { TouchableHighlight } from 'react-native';

import { Icon } from '../../base/font-icons';

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
     * Handles rendering of the actual item.
     *
     * TODO: currently no handling for labels is implemented.
     *
     * @protected
     * @returns {ReactElement}
     */
    _renderItem() {
        const {
            accessibilityLabel,
            disabled,
            onClick,
            styles
        } = this.props;

        return (
            <TouchableHighlight
                accessibilityLabel = { accessibilityLabel }
                disabled = { disabled }
                onPress = { onClick }
                style = { styles && styles.style }
                underlayColor = { styles && styles.underlayColor } >
                <Icon
                    name = { this._getIconName() }
                    style = { styles && styles.iconStyle } />
            </TouchableHighlight>
        );
    }
}
