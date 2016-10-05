import React from 'react';
import Icon from 'react-fontawesome';

import { stopEventPropagation } from '../../base/react';

import AbstractToolbarButton from './AbstractToolbarButton';

/**
 * Represents a button in Toolbar on Web.
 *
 * @extends AbstractToolbarButton
 */
export default class ToolbarButton extends AbstractToolbarButton {

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

        'onClick' in this.props
            && (props.onClick = stopEventPropagation(this.props.onClick));
        'style' in this.props && (props.style = this.props.style);

        return React.createElement('button', props, children);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @inheritdoc
     */
    _renderIcon() {
        return super._renderIcon(Icon);
    }
}

/**
 * ToolbarButton component's property types.
 *
 * @static
 */
ToolbarButton.propTypes = AbstractToolbarButton.propTypes;
