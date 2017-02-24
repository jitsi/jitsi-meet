/* @flow */

import React from 'react';

import AbstractToolbarButton from './AbstractToolbarButton';
import primaryToolbarHandlers from './primaryToolbarHandlers';
import secondaryToolbarHandlers from './secondaryToolbarHandlers';

import UIUtil from '../../../../modules/UI/util/UIUtil';

declare var APP: Object;
declare var interfaceConfig: Object;
declare var $: Object;

/**
 * Handlers for toolbar buttons.
 *
 * buttonId {string}: handler {function}
 */
const buttonHandlers = Object.assign({}, primaryToolbarHandlers,
    secondaryToolbarHandlers);

/**
 * Represents a button in Toolbar on React.
 *
 * @class ToolbarButton
 * @extends AbstractToolbarButton
 */
export default class ToolbarButton extends AbstractToolbarButton {

    /**
     * Initializes new ToolbarButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.popups = [];
        this.onClick = event => {
            const handler = buttonHandlers[props.id];

            !$(event.target).prop('disabled') && handler(event);
        };

        // Bind methods to save the context
        this._pushPopup = this._pushPopup.bind(this);
    }

    /**
     * Forces translation of the button and sets shortcut/tooltip
     * after mounting of the component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this.popups.forEach(popup => {
            APP.translation.translateElement($(popup));
        });

        this._setShortcutAndTooltip();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props.hidden) {
            return null;
        }

        const popups = this.props.popups || [];
        const className = this.props.className;
        const id = this.props.id;
        const props = {
            className,
            id
        };

        props['data-container'] = 'body';
        props['data-placement'] = 'bottom';

        props.onClick = this.onClick;

        if (this.props.shortcutAttr) {
            props.shortcut = this.props.shortcutAttr;
        }

        if (this.props.content) {
            props.content = this.props.content;
        }

        if (this.props.i18n) {
            props['data-i18n'] = this.props.i18n;
        }

        return (
            <a { ...props } >
                { this._renderInnerElementsIfRequired() }
                { this._renderPopups(popups) }
            </a>
        );
    }

    /**
     * If toolbar button should contain children elements
     * renders them.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderInnerElementsIfRequired() {
        if (this.props.html) {
            return this.props.html;
        }

        return null;
    }

    /**
     * Renders popup element for toolbar button.
     *
     * @param {Array} popups - Array of popup objects.
     * @returns {Array}
     * @private
     */
    _renderPopups(popups = []) {
        return popups.map(popup => {
            let gravity = 'n';

            if (popup.dataAttrPosition) {
                gravity = popup.dataAttrPosition;
            }

            return (
                <div
                    className = { popup.className }
                    data-i18n = { popup.dataAttr }
                    data-tooltip = { gravity }
                    id = { popup.id }
                    key = { popup.id }
                    ref = { this._pushPopup } />
            );
        });
    }

    /**
     * Adds popup to the array property.
     *
     * @param {HTMLElement} popup - Popup element.
     * @returns {void}
     * @private
     */
    _pushPopup(popup) {
        this.popups.push(popup);
    }

    /**
     * Sets shortcut and tooltip for current toolbar button.
     *
     * @private
     * @returns {void}
     */
    _setShortcutAndTooltip() {
        const id = this.props.id;

        if (UIUtil.isButtonEnabled()) {
            const buttonElement = document.getElementById(id);

            if (!buttonElement) {
                return false;
            }

            const tooltipPosition
                = interfaceConfig.MAIN_TOOLBAR_BUTTONS.indexOf(id) > -1
                ? 'bottom' : 'right';

            UIUtil.setTooltip(buttonElement,
                this.props.tooltipKey,
                tooltipPosition);

            if (this.props.shortcut) {
                APP.keyboardshortcut.registerShortcut(
                    this.props.shortcut,
                    this.props.shortcutAttr,
                    this.props.shortcutFunc,
                    this.props.shortcutDescription
                );
            }
        }
    }
}
