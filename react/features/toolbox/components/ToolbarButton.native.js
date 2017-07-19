import React from 'react';
import { TouchableHighlight } from 'react-native';
import { connect } from 'react-redux';

import { Icon } from '../../base/font-icons';

import AbstractToolbarButton from './AbstractToolbarButton';

/**
 * Represents a button in Toolbar on React Native.
 *
 * @extends AbstractToolbarButton
 */
class ToolbarButton extends AbstractToolbarButton {
    /**
     * ToolbarButton component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractToolbarButton.propTypes,

        /**
         * Indicates if this button is disabled or not.
         */
        disabled: React.PropTypes.bool
    };

    /**
     * Renders the button of this Toolbar button.
     *
     * @param {Object} children - The children, if any, to be rendered inside
     * the button. Presumably, contains the icon of this Toolbar button.
     * @protected
     * @returns {ReactElement} The button of this Toolbar button.
     */
    _renderButton(children) {
        const props = {};

        'disabled' in this.props && (props.disabled = this.props.disabled);
        'onClick' in this.props && (props.onPress = event => {
            this.props.onClick(event);
        });
        'style' in this.props && (props.style = this.props.style);
        'underlayColor' in this.props
            && (props.underlayColor = this.props.underlayColor);

        return React.createElement(TouchableHighlight, props, children);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @inheritdoc
     */
    _renderIcon() {
        return super._renderIcon(Icon);
    }
}

export default connect()(ToolbarButton);
